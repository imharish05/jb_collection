import { createSlice } from "@reduxjs/toolkit";

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    items: [],
    unreadCount: 0,
    loading: false,
    // inventory settings cached here too
    settings: { highStockThreshold: 51, mediumStockThreshold: 11, lowStockThreshold: 1 },
    settingsLoading: false,
    summary: { total: 0, high: 0, medium: 0, low: 0, out_of_stock: 0 },
    summaryLoading: false,
  },
  reducers: {
    setLoading:     (s) => { s.loading = true; },
    setNotifications: (s, a) => {
      s.loading    = false;
      s.items      = a.payload.notifications;
      s.unreadCount = a.payload.unreadCount;
    },
    setUnreadCount: (s, a) => { s.unreadCount = a.payload; },
    markItemRead:   (s, a) => {
      const n = s.items.find(i => i.id === a.payload);
      if (n) n.isRead = true;
    },
    markAllItemsRead: (s) => {
      s.items.forEach(i => { i.isRead = true; });
      s.unreadCount = 0;
    },
    setSettings:    (s, a) => { s.settings = a.payload; s.settingsLoading = false; },
    setSettingsLoading: (s) => { s.settingsLoading = true; },
    setSummary:     (s, a) => { s.summary = a.payload; s.summaryLoading = false; },
    setSummaryLoading: (s) => { s.summaryLoading = true; },
  },
});

export const {
  setLoading, setNotifications, setUnreadCount,
  markItemRead, markAllItemsRead,
  setSettings, setSettingsLoading,
  setSummary, setSummaryLoading,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
