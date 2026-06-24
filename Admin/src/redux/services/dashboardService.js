import api from "../../api/axiosInstance";
import toast from "react-hot-toast";
import {
    setLoading, setDashboardData, setRecentVariants, setError, setOrderCounts,
    setGraphLoading, setMonthlyData, setMonthlySalesData, setGraphError,
    setQuarterlyLoading, setQuarterlySalesData, setQuarterlyError,
} from "../slices/dashboardSlice";

let dashboardLoaded = false;

export const fetchDashboardData = () => async (dispatch) => {
    dispatch(setLoading());
    try {
        const [statsRes, productsRes] = await Promise.all([
            api.get("/dashboard/stats"),
            api.get("/products"),
        ]);
        const stats = statsRes.data.stats || {};
        const recentProducts = statsRes.data.recentProducts || [];
        let totalStock = 0;
        productsRes.data.forEach(p => {
            p.Variants?.forEach(v => { totalStock += Number(v.stock) || 0; });
        });
        dispatch(setDashboardData({ stats, recentProducts, totalStock }));
    } catch (err) {
        const msg = err.response?.data?.message || "Failed to load dashboard stats";
        dispatch(setError(msg));
        // Show toast — no throw, so no fallback error screen
        toast.error(msg, { id: "dash-stats-err" });
    }
};

export const fetchRecentVariants = () => async (dispatch) => {
    try {
        const res = await api.get("/dashboard/recent-variants");
        dispatch(setRecentVariants({ variants: res.data.variants, thresholds: res.data.thresholds }));
    } catch (err) {
        // Silent fail — variants are non-critical, no toast needed
        console.warn("[Dashboard] fetchRecentVariants failed:", err?.message);
    }
};

export const fetchOrderCounts = () => async (dispatch) => {
    try {
        const statuses = ["new", "confirmed", "shipped", "delivery", "delivered", "cancelled", "returned"];
        const results = await Promise.allSettled(statuses.map(s => api.get(`/orders/status/${s}`)));
        const counts = {};
        results.forEach((r, i) => {
            counts[statuses[i]] = r.status === "fulfilled" && Array.isArray(r.value.data) ? r.value.data.length : 0;
        });
        dispatch(setOrderCounts(counts));
    } catch (err) {
        // Promise.allSettled never throws — safety net only
        console.warn("[Dashboard] fetchOrderCounts failed:", err?.message);
    }
};

export const fetchMonthlyOrders = (year) => async (dispatch) => {
    dispatch(setGraphLoading());
    try {
        const [ordersRes, salesRes] = await Promise.all([
            api.get(`/dashboard/monthly-orders?year=${year}`),
            api.get(`/dashboard/monthly-sales?year=${year}`),
        ]);
        dispatch(setMonthlyData(ordersRes.data));
        dispatch(setMonthlySalesData(salesRes.data));
    } catch (err) {
        dispatch(setGraphError());
        // Show toast — no throw, chart just stays empty
        toast.error("Failed to load chart data. Please refresh.", { id: "dash-chart-err" });
    }
};

export const fetchQuarterlySales = (year) => async (dispatch) => {
    dispatch(setQuarterlyLoading());
    try {
        const res = await api.get(`/dashboard/quarterly-sales?year=${year}`);
        dispatch(setQuarterlySalesData(res.data));
    } catch (err) {
        dispatch(setQuarterlyError());
        // Show toast — no throw
        toast.error("Failed to load quarterly data. Please refresh.", { id: "dash-quarterly-err" });
    }
};

export const loadDashboard = (dispatch) => {
    if (dashboardLoaded) return;
    dashboardLoaded = true;

    const year = new Date().getFullYear();

    // Each fetch is independent — one failure won't block others.
    // Success is silent (dashboard just loads normally).
    // Errors show as individual toasts.
    dispatch(fetchDashboardData());
    dispatch(fetchRecentVariants());
    dispatch(fetchOrderCounts());
    dispatch(fetchMonthlyOrders(year));
    dispatch(fetchQuarterlySales(year));
};

export const loadChart = (dispatch, year) => {
    dispatch(fetchMonthlyOrders(year));
    dispatch(fetchQuarterlySales(year));
};