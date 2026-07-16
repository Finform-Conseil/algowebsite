"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { AppNotification, getMockNotifications, NotificationType } from "@/components/design-system/layouts/HeaderHome/lib/mock-notifications";

import { toast } from "react-hot-toast";

interface GlobalNotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<AppNotification, "id" | "timestamp" | "isRead">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const GlobalNotificationContext = createContext<GlobalNotificationContextType | undefined>(undefined);

export const GlobalNotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(getMockNotifications());

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const addNotification = useCallback((data: Omit<AppNotification, "id" | "timestamp" | "isRead">) => {
    const newNotification: AppNotification = {
      id: Date.now().toString(),
      timestamp: new Date(),
      isRead: false,
      ...data,
    };
    setNotifications((prev) => [newNotification, ...prev]);

    // [NEW] Trigger Toaster
    toast(data.message, {
      icon: data.type === "warning" ? "⚠️" : "🔔",
      duration: data.duration || 3000,
      style: {
        borderRadius: "8px",
        background: "#1e293b",
        color: "#fff",
        border: "1px solid #334155",
      },
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <GlobalNotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </GlobalNotificationContext.Provider>
  );
};

export const useGlobalNotification = () => {
  const context = useContext(GlobalNotificationContext);
  if (!context) {
    throw new Error("useGlobalNotification must be used within a GlobalNotificationProvider");
  }
  return context;
};
