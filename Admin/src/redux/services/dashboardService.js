import api from "../../api/axiosInstance";
import toast from "react-hot-toast";
import { setLoading, setDashboardData, setError, setOrderCounts, setGraphLoading, setMonthlyData, setGraphError } from "../slices/dashboardSlice";

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
        const msg = err.response?.data?.message || "Failed to load dashboard";
        dispatch(setError(msg));
        throw err;
    }
};

export const fetchOrderCounts = () => async (dispatch) => {
    const statuses = ["new", "confirmed", "shipped", "delivery", "delivered", "cancelled"];
    const results = await Promise.allSettled(statuses.map(s => api.get(`/orders/status/${s}`)));
    const counts = {};
    results.forEach((r, i) => {
        counts[statuses[i]] = r.status === "fulfilled" && Array.isArray(r.value.data) ? r.value.data.length : 0;
    });
    dispatch(setOrderCounts(counts));
};

export const fetchMonthlyOrders = (year) => async (dispatch) => {
    dispatch(setGraphLoading());
    try {
        const res = await api.get(`/dashboard/monthly-orders?year=${year}`);
        dispatch(setMonthlyData(res.data));
    } catch (err) {
        dispatch(setGraphError());
        throw err;
    }
};

export const loadDashboard = (dispatch) => {
    if (dashboardLoaded) return;
    dashboardLoaded = true;

    toast.promise(
        Promise.all([
            dispatch(fetchDashboardData()),
            dispatch(fetchOrderCounts()),
            dispatch(fetchMonthlyOrders(new Date().getFullYear())),
        ]),
        {
            loading: 'Loading dashboard…',
            success: 'Dashboard loaded successfully',
            error: 'Failed to load dashboard',
        },
        { id: 1 }
    );
};

export const loadChart = (dispatch, year) => {
        dispatch(fetchMonthlyOrders(year))
};