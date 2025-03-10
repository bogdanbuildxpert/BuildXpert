"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications-context";
import Link from "next/link";
import { Loader2, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  job: {
    id: string;
    title: string;
  };
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingMessageIds, setDeletingMessageIds] = useState<Set<string>>(
    new Set()
  );
  const { user } = useAuth();
  const { resetUnreadCount } = useNotifications();

  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages/all?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data);

          // Mark all messages as read
          const unreadMessages = data.filter(
            (msg: Message) => !msg.isRead && msg.receiverId === user.id
          );

          if (unreadMessages.length > 0) {
            await Promise.all(
              unreadMessages.map((msg: Message) =>
                fetch(`/api/messages/${msg.id}/read`, {
                  method: "PUT",
                })
              )
            );

            // Reset unread count
            resetUnreadCount();
          }
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [user, resetUnreadCount]);

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
        toast.success("Message deleted successfully");
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

  if (!user) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-4">Messages</h1>
        <p>Please log in to view your messages.</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Messages</h1>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : messages.length === 0 ? (
        <p>You have no messages.</p>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-4 rounded-lg border ${
                !message.isRead && message.receiverId === user?.id
                  ? "bg-primary/5 border-primary"
                  : "bg-card border-border"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-medium">
                    {message.sender.name || message.sender.email}
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {formatDistanceToNow(new Date(message.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/jobs/${message.jobId}`}
                    className="text-sm text-primary hover:underline"
                  >
                    View Job: {message.job.title}
                  </Link>
                  {message.senderId === user?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100"
                      onClick={() => handleDeleteMessage(message.id)}
                      disabled={deletingMessageIds.has(message.id)}
                      title="Delete message"
                    >
                      {deletingMessageIds.has(message.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-sm">{message.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
