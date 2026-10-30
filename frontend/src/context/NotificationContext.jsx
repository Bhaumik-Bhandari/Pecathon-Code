import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "tsukuyomi-watch-notifications-v1";
const SETTINGS_KEY = "tsukuyomi-watch-settings-v1";

const DEFAULT_SETTINGS = {
  autoLunarAlerts: true,
  meteorPeakAlerts: true,
  issPassAlerts: true,
  defaultLocationName: "Hanle Dark Sky Reserve, Ladakh",
  defaultLatitude: 32.7794,
  defaultLongitude: 78.9642,
  bortleThreshold: 3,
};

const NotificationContext = createContext(null);

function loadStoredNotifications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadStoredSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(loadStoredNotifications);
  const [settings, setSettings] = useState(loadStoredSettings);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      // Keep working in memory if storage quota is exceeded
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Keep working in memory
    }
  }, [settings]);

  const addNotification = useCallback((payload) => {
    if (!payload || !payload.title) return;

    const id = payload.id || `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const nowIso = new Date().toISOString();

    setNotifications((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === id);
      if (existingIndex !== -1) {
        // If explicitly re-pushed manually, move to top and mark unread; if auto-push, preserve existing state
        if (payload.forceUnread) {
          const updated = {
            ...prev[existingIndex],
            ...payload,
            read: false,
            timestamp: nowIso,
          };
          const remaining = prev.filter((_, idx) => idx !== existingIndex);
          return [updated, ...remaining];
        }
        return prev;
      }

      const nextAlert = {
        id,
        title: payload.title,
        message: payload.message || "",
        category: payload.category || "Lunar Alert",
        eventDate: payload.eventDate || "",
        timestamp: payload.timestamp || nowIso,
        read: false,
        route: payload.route || "/celestial-scroll",
      };

      return [nextAlert, ...prev].slice(0, 30);
    });
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const updateSettings = useCallback((partial) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearNotifications,
      settings,
      updateSettings,
      settingsModalOpen,
      setSettingsModalOpen,
    }),
    [
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearNotifications,
      settings,
      updateSettings,
      settingsModalOpen,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}

export default NotificationContext;
