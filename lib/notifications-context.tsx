"use client";

import { createContext, useContext, ReactNode } from "react";

// Create a simplified context with no functionality
interface NotificationsContextType {
  unreadCount: number;
  notifications: any[];
  loading: boolean;
  resetUnreadCount: () => void;
  incrementUnreadCount: () => void;
  clearAllNotifications: () => Promise<boolean>;
  markNotificationAsRead: (messageId: string) => Promise<boolean>;
}

// Create the context with default empty values
const NotificationsContext = createContext<
  NotificationsContextType | undefined
>(undefined);

// Export the provider component
export function NotificationsProvider({ children }: { children: ReactNode }) {
  // Provide empty stub implementations
  const contextValue: NotificationsContextType = {
    unreadCount: 0,
    notifications: [],
    loading: false,
    resetUnreadCount: () => {},
    incrementUnreadCount: () => {},
    clearAllNotifications: async () => true,
    markNotificationAsRead: async () => true,
  };

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
    </NotificationsContext.Provider>
  );
}

// Export the hook to use the context
export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider"
    );
  }
  return context;
}
