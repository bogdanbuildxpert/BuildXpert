"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./auth-context";
import io from "socket.io-client";

interface Sender {
  id: string;
  name: string | null;
  email: string;
}

interface Job {
  id: string;
  title: string;
}

interface Message {
  id: string;
  content: string;
  isRead: boolean;
  senderId: string;
  receiverId: string;
  jobId: string;
  createdAt: string;
  updatedAt: string;
  sender?: Sender;
  job?: Job;
}

interface NotificationsContextType {
  unreadCount: number;
  notifications: Message[];
  loading: boolean;
  resetUnreadCount: () => void;
  incrementUnreadCount: () => void;
  clearAllNotifications: () => Promise<boolean>;
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (messageId: string) => Promise<boolean>;
}

const NotificationsContext = createContext<
  NotificationsContextType | undefined
>(undefined);

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Reset unread count
  const resetUnreadCount = () => {
    setUnreadCount(0);
  };

  // Increment unread count
  const incrementUnreadCount = () => {
    setUnreadCount((prev) => prev + 1);
  };

  // Fetch notifications
  const fetchNotifications = async (): Promise<void> => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch("/api/messages/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (
    messageId: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await fetch("/api/messages/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messageId }),
      });

      if (response.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.filter((notification) => notification.id !== messageId)
        );

        // Decrement unread count
        setUnreadCount((prev) => Math.max(0, prev - 1));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  };

  // Clear all notifications
  const clearAllNotifications = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await fetch("/api/messages/clear-notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        resetUnreadCount();
        setNotifications([]);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error clearing notifications:", error);
      return false;
    }
  };

  // Initialize Socket.IO connection to listen for new messages
  useEffect(() => {
    if (!user) return;

    // Fetch initial unread count
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch("/api/messages/unread");
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.count);
        }
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();
    fetchNotifications();

    // Polling fallback for when Socket.IO isn't available
    let pollingInterval: NodeJS.Timeout | null = null;
    let socket: any = null;

    try {
      // Set up Socket.IO connection
      socket = io(window.location.origin, {
        path: "/socket.io",
        transports: ["polling", "websocket"],
        forceNew: true,
        timeout: 20000,
        reconnectionAttempts: 3,
        autoConnect: true,
      });

      // Listen for new messages
      socket.on("connect", () => {
        console.log("Notifications socket connected");
        socket.emit("join", user.id);
        // Clear polling if we successfully connect
        if (pollingInterval) {
          clearInterval(pollingInterval);
          pollingInterval = null;
        }
      });

      socket.on("connect_error", (error: any) => {
        console.warn("Socket.IO connection error:", error.message);
        // Set up polling as fallback if socket connection fails
        if (!pollingInterval) {
          console.log("Setting up polling fallback for notifications");
          pollingInterval = setInterval(() => {
            fetchUnreadCount();
            fetchNotifications();
          }, 15000); // Poll every 15 seconds
        }
      });

      socket.on("new_message", (message: Message) => {
        // Only increment count if the current user is the receiver and not the sender
        if (message.receiverId === user.id && message.senderId !== user.id) {
          incrementUnreadCount();
          // Add the new message to notifications
          setNotifications((prev) => [message, ...prev]);
        }
      });
    } catch (error) {
      console.warn(
        "Failed to initialize Socket.IO, falling back to polling",
        error
      );
      // Set up polling as fallback
      pollingInterval = setInterval(() => {
        fetchUnreadCount();
        fetchNotifications();
      }, 15000); // Poll every 15 seconds
    }

    return () => {
      // Clean up
      if (socket) {
        socket.disconnect();
      }
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [user, fetchNotifications]);

  return (
    <NotificationsContext.Provider
      value={{
        unreadCount,
        notifications,
        loading,
        resetUnreadCount,
        incrementUnreadCount,
        clearAllNotifications,
        fetchNotifications,
        markNotificationAsRead,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider"
    );
  }
  return context;
}
