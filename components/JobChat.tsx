"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import io from "socket.io-client";

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

export function JobChat({ jobId, jobPosterId, adminId }: JobChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const socketRef = useRef<any>(null);

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
    if (!user || !isMountedRef.current) return;

    try {
      setIsRefreshing(true);

      // For both admin and job poster, we want to see the conversation between them
      const url = `/api/messages?jobId=${jobId}&userId=${user.id}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setMessages(data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      if (isMountedRef.current) {
        toast.error("Failed to load messages");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [user, jobId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Set up Socket.IO connection and fetch initial messages
  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchMessages();

    // Set up Socket.IO connection with explicit URL and options
    const socket = io(window.location.origin, {
      path: "/socket.io",
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      // Use only polling to avoid WebSocket issues
      transports: ["polling"],
      forceNew: true,
      timeout: 20000,
    });

    socketRef.current = socket;

    // Log connection status
    socket.on("connect", () => {
      console.log("Socket.IO connected with ID:", socket.id);
      setSocketConnected(true);

      // Join user-specific room
      socket.emit("join", user.id);
    });

    socket.on("disconnect", () => {
      console.log("Socket.IO disconnected");
      setSocketConnected(false);
    });

    socket.on("reconnect", (attemptNumber: number) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      setSocketConnected(true);
      // Re-join the room after reconnection
      socket.emit("join", user.id);
    });

    socket.on("reconnect_attempt", (attemptNumber: number) => {
      console.log(`Socket reconnection attempt #${attemptNumber}`);
    });

    socket.on("reconnect_error", (error: Error) => {
      console.error("Socket reconnection error:", error);
    });

    socket.on("reconnect_failed", () => {
      console.error("Socket failed to reconnect after all attempts");
      toast.error("Failed to connect to chat server. Please refresh the page.");
    });

    socket.on("connect_error", (error: Error) => {
      console.error("Socket.IO connection error:", error);
      setSocketConnected(false);
    });

    // Listen for new messages
    socket.on("new_message", (message: Message) => {
      console.log("Received new message via socket:", message);
      if (message.jobId === jobId) {
        // Add message if it's not already in the list
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });

        // Mark message as read if user is the receiver
        if (message.receiverId === user.id) {
          // First update the API
          fetch(`/api/messages/read?jobId=${jobId}&userId=${user.id}`, {
            method: "POST",
          })
            .then(() => {
              // Then emit the socket event to notify the sender
              socket.emit("mark_read", {
                jobId,
                readBy: user.id,
                senderId: message.senderId,
              });
            })
            .catch((err) =>
              console.error("Error marking messages as read:", err)
            );
        }
      }
    });

    // Listen for messages being marked as read
    socket.on("messages_read", (data: { jobId: string; readBy: string }) => {
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

    return () => {
      socket.disconnect();
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
      console.log("Message created successfully:", newMessageData);

      // Clear the input field after sending
      setNewMessage("");

      // Add the message to the local state immediately for better UX
      setMessages((prev) => [...prev, newMessageData]);

      // Emit the new message to Socket.IO
      if (socketRef.current && socketRef.current.connected) {
        console.log("Emitting send_message event:", newMessageData);
        socketRef.current.emit("send_message", newMessageData);
      } else {
        console.warn(
          "Socket not connected, message will not be sent in real-time"
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
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
            className="min-h-[80px] resize-none"
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
