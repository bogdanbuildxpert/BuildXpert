"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./auth-context";
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
}

interface NotificationsContextType {
  unreadCount: number;
  resetUnreadCount: () => void;
  incrementUnreadCount: () => void;
  clearAllNotifications: () => Promise<boolean>;
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
  const { user } = useAuth();

  // Reset unread count
  const resetUnreadCount = () => {
    setUnreadCount(0);
  };

  // Increment unread count
  const incrementUnreadCount = () => {
    setUnreadCount((prev) => prev + 1);
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

    // Set up Socket.IO connection
    const socket = io(window.location.origin, {
      path: "/socket.io",
      transports: ["polling"],
      forceNew: true,
      timeout: 20000,
    });

    // Listen for new messages
    socket.on("connect", () => {
      console.log("Notifications socket connected");
      socket.emit("join", user.id);
    });

    socket.on("new_message", (message: Message) => {
      // Only increment count if the current user is the receiver and not the sender
      if (message.receiverId === user.id && message.senderId !== user.id) {
        incrementUnreadCount();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  return (
    <NotificationsContext.Provider
      value={{
        unreadCount,
        resetUnreadCount,
        incrementUnreadCount,
        clearAllNotifications,
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
