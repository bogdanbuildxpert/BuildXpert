"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import io from "socket.io-client";

// These variables help throttle API calls across all instances of JobChat
const THROTTLE_DELAY = 5000; // 5 seconds
let lastFetchTime = 0;
let isFetchingGlobally = false;
let pendingFetchRequest = false;

interface Message {
  id: string;
  content: string;
  isRead: boolean;
  senderId: string;
  receiverId: string;
  jobId: string;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  receiver: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
}

interface JobChatProps {
  jobId: string;
  jobPosterId: string;
  adminId?: string; // Optional admin ID for direct messaging
}

// Helper function to check if we should throttle
function shouldThrottle(): boolean {
  const now = Date.now();
  return now - lastFetchTime < THROTTLE_DELAY || isFetchingGlobally;
}

export function JobChat({ jobId, jobPosterId, adminId }: JobChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMountedRef = useRef(true);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const hasLoadedMessagesRef = useRef(false);

  const isAdmin = user?.role === "ADMIN" || user?.role === "admin";
  const isJobPoster = user?.id === jobPosterId;

  // Determine if the current user can view the chat
  const canViewChat = isAdmin || isJobPoster;

  // Determine the receiver ID based on user role
  const getReceiverId = () => {
    if (isAdmin) {
      return jobPosterId; // Admin sends to job poster
    } else if (isJobPoster && adminId) {
      return adminId; // Job poster sends to specific admin
    }
    return null; // Should not happen if canViewChat is properly enforced
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Disconnect socket on unmount
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Fetch messages (initial load and manual refresh)
  const fetchMessages = useCallback(async () => {
    if (!user || !isMountedRef.current || !jobId) return;

    // Skip if already fetching or throttled
    if (shouldThrottle()) {
      console.log(`Throttling messages fetch for job ${jobId}`);
      pendingFetchRequest = true;
      return;
    }

    // Set global fetch state
    isFetchingGlobally = true;
    lastFetchTime = Date.now();
    pendingFetchRequest = false;

    try {
      setIsLoading(true);

      // For both admin and job poster, we want to see the conversation between them
      const url = `/api/messages?jobId=${jobId}&userId=${user.id}`;

      const response = await fetch(url, {
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setMessages(data);
        hasLoadedMessagesRef.current = true;
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      if (isMountedRef.current) {
        toast.error("Failed to load messages");
      }
    } finally {
      isFetchingGlobally = false;
      if (isMountedRef.current) {
        setIsLoading(false);
      }

      // Check if another fetch was requested while we were fetching
      if (pendingFetchRequest && isMountedRef.current) {
        setTimeout(() => {
          if (isMountedRef.current) {
            fetchMessages();
          }
        }, 1000); // Small delay to prevent immediate refetching
      }
    }
  }, [user, jobId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Set up Socket.IO connection for real-time messages
  useEffect(() => {
    if (!user || !jobId) return;

    // First fetch existing messages once when the component mounts
    fetchMessages();

    let socket: any = null;

    try {
      // Set up socket connection
      socket = io(window.location.origin, {
        path: "/socket.io/",
        transports: ["polling", "websocket"],
        forceNew: true,
        reconnectionAttempts: 3,
        timeout: 20000,
      });

      // Store socket in ref for later use
      socketRef.current = socket;

      socket.on("connect", () => {
        console.log(
          `[JobChat] Socket connected with ID: ${socket.id} for job ${jobId}`
        );
        setSocketConnected(true);

        // Join user-specific room
        if (user.id) {
          socket.emit("join", user.id);
          console.log(`[JobChat] Joined room for user: ${user.id}`);
        }
      });

      socket.on("disconnect", () => {
        console.log(`[JobChat] Socket disconnected for job ${jobId}`);
        setSocketConnected(false);
      });

      socket.on("connect_error", (error: Error) => {
        console.error(
          `[JobChat] Socket connection error for job ${jobId}:`,
          error
        );
        setSocketConnected(false);
      });

      socket.on("reconnect", (attemptNumber: number) => {
        console.log(
          `[JobChat] Socket reconnected after ${attemptNumber} attempts for job ${jobId}`
        );
        setSocketConnected(true);

        // Re-join the room after reconnection
        if (user.id) {
          socket.emit("join", user.id);
          console.log(`[JobChat] Rejoined room for user: ${user.id}`);
        }

        // Only fetch messages if we haven't loaded them recently
        if (!shouldThrottle() && hasLoadedMessagesRef.current) {
          fetchMessages();
        }
      });

      // Listen for new messages
      socket.on("new_message", (message: Message) => {
        console.log(
          `[JobChat] Received new message via socket for job ${jobId}:`,
          message
        );

        // Only handle messages for this specific job
        if (message.jobId === jobId) {
          // Add message if it's not already in the list
          setMessages((prev) => {
            if (prev.some((m) => m.id === message.id)) {
              return prev;
            }
            return [...prev, message];
          });

          // Mark message as read if user is the receiver
          if (message.receiverId === user.id && socket.connected) {
            console.log(`[JobChat] Marking message ${message.id} as read`);

            // First update the API
            fetch(`/api/messages/read?jobId=${jobId}&userId=${user.id}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            })
              .then(() => {
                // Then emit the socket event to notify the sender
                socket.emit("mark_read", {
                  jobId,
                  readBy: user.id,
                  senderId: message.senderId,
                });
                console.log(
                  `[JobChat] Emitted mark_read event for job ${jobId}`
                );
              })
              .catch((err) =>
                console.error(
                  `[JobChat] Error marking messages as read for job ${jobId}:`,
                  err
                )
              );
          }
        }
      });

      // Listen for messages being marked as read
      socket.on("messages_read", (data: { jobId: string; readBy: string }) => {
        console.log(
          `[JobChat] Received messages_read event for job ${jobId}:`,
          data
        );

        if (data.jobId === jobId) {
          // Update read status for messages sent by current user
          setMessages((prev) =>
            prev.map((msg) =>
              msg.senderId === user.id && msg.receiverId === data.readBy
                ? { ...msg, isRead: true }
                : msg
            )
          );
        }
      });
    } catch (error) {
      console.warn(
        `[JobChat] Failed to initialize Socket.IO for job ${jobId}, falling back to one-time fetch`,
        error
      );

      // Just fetch once on error, no continuous polling
      fetchMessages();
    }

    return () => {
      if (socketRef.current) {
        console.log(`[JobChat] Cleaning up socket connection for job ${jobId}`);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, jobId, fetchMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to send messages");
      return;
    }

    if (!newMessage.trim()) {
      return;
    }

    const receiverId = getReceiverId();
    if (!receiverId) {
      toast.error("Unable to determine message recipient");
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newMessage,
          senderId: user.id,
          receiverId: receiverId,
          jobId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const newMessageData = await response.json();
      console.log(
        `[JobChat] Message created successfully for job ${jobId}:`,
        newMessageData
      );

      // Clear the input field after sending
      setNewMessage("");

      // Refocus the textarea after sending
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);

      // Add the message to the local state immediately for better UX
      setMessages((prev) => [...prev, newMessageData]);

      // The PostgreSQL trigger will handle the notification, no need to emit here
    } catch (error) {
      console.error(`[JobChat] Error sending message for job ${jobId}:`, error);
      if (isMountedRef.current) {
        toast.error("Failed to send message");
      }
    } finally {
      if (isMountedRef.current) {
        setIsSending(false);
      }
    }
  };

  // Format date
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-IE", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
      day: "numeric",
      month: "short",
    }).format(date);
  };

  // Handle key press in the textarea
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message on Enter without Shift key
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as unknown as React.FormEvent);
      // Refocus the textarea after sending
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  };

  if (!canViewChat) {
    return null;
  }

  if (!adminId && isJobPoster) {
    return (
      <div className="border border-border rounded-lg p-6">
        <p className="text-muted-foreground text-center">
          Chat is currently unavailable. Please try again later.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6 h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="bg-muted p-4 border-b border-border flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {isAdmin
            ? `Chat with Job Poster (${messages[0]?.receiver.name || "Client"})`
            : "Chat with Administrator"}
        </h2>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs ${
              socketConnected ? "text-green-500" : "text-amber-500"
            }`}
          >
            {socketConnected ? "Connected" : "Reconnecting..."}
            <span
              className={`inline-block h-2 w-2 rounded-full ml-1 ${
                socketConnected ? "bg-green-500" : "bg-amber-500 animate-pulse"
              }`}
            ></span>
          </span>
        </div>
      </div>

      <div className="h-[300px] overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUserSender = message.senderId === user?.id;

            return (
              <div
                key={message.id}
                className={`flex ${
                  isCurrentUserSender ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    isCurrentUserSender
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <div className="text-sm font-medium mb-1">
                    {isCurrentUserSender
                      ? "You"
                      : message.sender.name ||
                        message.sender.email.split("@")[0]}
                    {message.sender.role === "ADMIN" && " (Admin)"}
                  </div>
                  <p className="break-words">{message.content}</p>
                  <div
                    className={`text-xs mt-1 ${
                      isCurrentUserSender
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {formatMessageTime(message.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            className="min-h-[80px] resize-none"
            ref={textareaRef}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isSending || !newMessage.trim()}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
