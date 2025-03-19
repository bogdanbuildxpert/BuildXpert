"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import io, { Socket } from "socket.io-client";

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

interface SimpleJobChatProps {
  jobId: string;
  jobPosterId: string;
}

export function SimpleJobChat({ jobId, jobPosterId }: SimpleJobChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [deletingMessageIds, setDeletingMessageIds] = useState<Set<string>>(
    new Set()
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const { resetUnreadCount } = useNotifications();
  // Track processed message IDs to prevent duplicates
  const processedMessageIds = useRef<Set<string>>(new Set());

  const isAdmin = user?.role === "ADMIN" || user?.role === "admin";
  const isJobPoster = user?.id === jobPosterId;
  const canViewChat = isAdmin || isJobPoster;

  // Get the receiver ID based on user role
  const getReceiverId = () => {
    if (!user) return null;

    // If user is admin, send to job poster
    if (isAdmin) {
      return jobPosterId;
    }

    // If user is job poster, send to admin
    if (user.id === jobPosterId) {
      // Try to find an admin from the existing messages
      const adminMessage = messages.find(
        (msg) => msg.sender.role === "ADMIN" || msg.receiver.role === "ADMIN"
      );

      if (adminMessage) {
        return adminMessage.sender.role === "ADMIN"
          ? adminMessage.sender.id
          : adminMessage.receiver.id;
      }

      // If no admin found in messages, we'll need to fetch one
      return null;
    }

    return null;
  };

  // Fetch messages
  const fetchMessages = async () => {
    if (!user || isRefreshing) return;

    // Set refreshing state
    setIsRefreshing(true);

    try {
      const response = await fetch(
        `/api/messages?jobId=${jobId}&userId=${user.id}`
      );
      if (response.ok) {
        const data = await response.json();

        // Check if there are any new messages
        const hasNewMessages = data.some(
          (newMsg: Message) =>
            !messages.some((existingMsg) => existingMsg.id === newMsg.id)
        );

        // Update messages state
        setMessages(data);

        // Mark messages as read when fetched
        const unreadMessages = data.filter(
          (msg: Message) => !msg.isRead && msg.receiverId === user.id
        );

        if (unreadMessages.length > 0) {
          // Mark messages as read in the database
          await Promise.all(
            unreadMessages.map((msg: Message) =>
              fetch(`/api/messages/${msg.id}/read`, {
                method: "PUT",
              })
            )
          );

          // Reset unread count in the notifications context
          resetUnreadCount();

          // Removed auto-scroll for new messages
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Only scroll to bottom on initial load, not when messages change
  useEffect(() => {
    // Only scroll on initial load
    if (isLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [isLoading]);

  // Function to scroll to the bottom of the messages
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Set up socket.io for real-time messaging
  useEffect(() => {
    if (!user || !jobId) return;

    let refreshInterval: NodeJS.Timeout | null = null;
    let socket: any = null;

    try {
      // Set up Socket.IO connection
      socket = io(window.location.origin, {
        path: "/socket.io",
        transports: ["polling", "websocket"],
        forceNew: true,
        reconnectionAttempts: 3,
        timeout: 20000,
      });

      socket.on("connect", () => {
        console.log("SimpleJobChat socket connected");

        // Join user-specific room
        socket.emit("join", user.id);

        // Clear polling interval if it exists
        if (refreshInterval) {
          clearInterval(refreshInterval);
          refreshInterval = null;
        }
      });

      socket.on("connect_error", (error: any) => {
        console.warn("Socket.IO connection error:", error.message);
        // Set up polling as fallback
        if (!refreshInterval) {
          console.log("Setting up polling fallback for chat messages");
          refreshInterval = setInterval(() => {
            fetchMessages();
          }, 10000); // Poll every 10 seconds
        }
      });

      // Listen for new messages
      socket.on("new_message", (message: Message) => {
        if (message.jobId === jobId) {
          setMessages((prev) => {
            // Skip if we already have this message
            if (prev.some((m) => m.id === message.id)) {
              return prev;
            }
            return [...prev, message];
          });

          // Scroll to the bottom when receiving new messages
          scrollToBottom();
        }
      });
    } catch (error) {
      console.warn(
        "Failed to initialize Socket.IO, falling back to polling",
        error
      );
      // Set up polling as fallback
      refreshInterval = setInterval(() => {
        fetchMessages();
      }, 10000); // Poll every 10 seconds
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [user, jobId, messages]);

  // Handle sending a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const receiverId = getReceiverId();

      // If we're a job poster and couldn't find an admin in existing messages
      if (!receiverId && user?.id === jobPosterId) {
        // Try to find any admin
        const response = await fetch("/api/users/admin");
        const data = await response.json();

        if (!data.id) {
          toast.error("No admin available to receive messages");
          return;
        }

        // Use the found admin ID
        await sendMessage(data.id);
      } else if (!receiverId) {
        toast.error("Could not determine message recipient");
        return;
      } else {
        // We have a receiver ID, send the message
        await sendMessage(receiverId);
      }

      setNewMessage("");
      // Refocus the textarea after sending
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  // Handle key press in the textarea
  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
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

  // Send a message to the specified receiver
  const sendMessage = async (receiverId: string) => {
    if (!user || !receiverId) return false;

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newMessage,
          senderId: user.id,
          receiverId,
          jobId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error:", errorData);
        throw new Error(errorData.error || "Failed to send message");
      }

      const data = await response.json();

      // Add the message ID to processed IDs to prevent duplication
      processedMessageIds.current.add(data.id);

      // Optimistically add the message to the UI
      setMessages((prev) => [
        ...prev,
        {
          ...data,
          sender: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          receiver: {
            id: receiverId,
            name: "", // We don't have this info
            email: "", // We don't have this info
            role: isAdmin ? "CLIENT" : "ADMIN", // Assume the opposite role
          },
        },
      ]);

      // Mark the message as read if the current user is the receiver
      if (data.receiverId === user.id) {
        fetch(`/api/messages/${data.id}/read`, {
          method: "PUT",
        });
      }

      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send message"
      );
      return false;
    }
  };

  // Format date for display
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
      day: "numeric",
      month: "short",
    }).format(date);
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      setDeletingMessageIds((prev) => new Set([...prev, messageId]));

      const response = await fetch(`/api/messages/${messageId}/delete`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove the message from the state
        setMessages((prevMessages) =>
          prevMessages.filter((message) => message.id !== messageId)
        );
        toast.success("Message deleted");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete message");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    } finally {
      setDeletingMessageIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    }
  };

  if (!canViewChat) {
    return null;
  }

  if (!user) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="text-center text-gray-500">
          Please log in to use the chat.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <div className="p-4 border-b bg-muted/50 flex justify-between items-center">
        <h3 className="font-medium">Job Chat</h3>
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

      {/* Messages container */}
      <div className="p-4 h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isCurrentUser = message.senderId === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${
                    isCurrentUser ? "justify-end" : "justify-start"
                  } group`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      isCurrentUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {formatMessageTime(message.createdAt)}
                        </p>
                      </div>
                      {/* Only show delete button for messages sent by the current user */}
                      {isCurrentUser && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-primary-foreground/70 hover:text-primary-foreground"
                          onClick={() => handleDeleteMessage(message.id)}
                          disabled={deletingMessageIds.has(message.id)}
                          title="Delete message"
                        >
                          {deletingMessageIds.has(message.id) ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            className="min-h-[80px] resize-none"
            disabled={isSending}
          />
          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              size="icon"
              disabled={!newMessage.trim() || isSending}
              className="h-10 w-10"
              title="Send message"
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
    </div>
  );
}
