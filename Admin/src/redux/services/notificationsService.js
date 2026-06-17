import api from "../../api/axiosInstance";
import toast from "react-hot-toast";
import {
  setLoading, setNotifications, setUnreadCount,
  markItemRead, markAllItemsRead, clearAllItems,
  setSettings, setSettingsLoading,
  setSummary, setSummaryLoading,
} from "../slices/notificationsSlice";

export const fetchNotifications = (limit = 5) => async (dispatch) => {
  dispatch(setLoading());
  try {
    const res = await api.get(`/notifications?limit=${limit}`);
    dispatch(setNotifications(res.data));
  } catch (e) {
    console.error("[Notifications] fetch error:", e);
  }
};

export const doMarkRead = (id) => async (dispatch) => {
  try {
    const res = await api.patch(`/notifications/read/${id}`);
    dispatch(markItemRead(id));
    dispatch(setUnreadCount(res.data.unreadCount));
  } catch (e) {
    console.error("[Notifications] markRead error:", e);
  }
};

export const doMarkAllRead = () => async (dispatch) => {
  try {
    await api.patch("/notifications/read-all");
    dispatch(markAllItemsRead());
  } catch (e) {
    console.error("[Notifications] markAllRead error:", e);
  }
};

export const doClearAll = () => async (dispatch) => {
  try {
    const res = await api.delete("/notifications/clear-all");
    dispatch(clearAllItems());
    toast.success(`Cleared ${res.data.deleted} read notification${res.data.deleted !== 1 ? "s" : ""}`);
  } catch (e) {
    console.error("[Notifications] clearAll error:", e);
    toast.error("Failed to clear notifications");
  }
};

export const fetchInventorySettings = () => async (dispatch) => {
  dispatch(setSettingsLoading());
  try {
    const res = await api.get("/inventory-settings");
    dispatch(setSettings(res.data));
  } catch (e) {
    console.error("[Notifications] fetchSettings error:", e);
  }
};

export const saveInventorySettings = (payload) => async (dispatch) => {
  try {
    const res = await api.put("/inventory-settings", payload);
    dispatch(setSettings(res.data.settings));
    toast.success("Inventory alert settings saved!");
    dispatch(fetchInventorySummary());
    return true;
  } catch (e) {
    const msg = e.response?.data?.message || "Failed to save settings";
    toast.error(msg);
    return false;
  }
};

export const fetchInventorySummary = () => async (dispatch) => {
  dispatch(setSummaryLoading());
  try {
    const res = await api.get("/inventory-settings/summary");
    dispatch(setSummary(res.data));
  } catch (e) {
    console.error("[Notifications] fetchSummary error:", e);
  }
};