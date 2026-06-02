import { createSlice } from "@reduxjs/toolkit";

const dashboardSlice = createSlice({
    name: "dashboard",
    initialState: {
        stats: { totalProducts: "-", totalCustomers: "-" },
        recentProducts: [],
        totalStock: "-",
        orderCounts: { new: 0, confirmed: 0, shipped: 0, delivery: 0, delivered: 0, cancelled: 0 },
        monthlyData: [],
        monthlySalesData: [],
        quarterlySalesData: [],   // { quarters: [...], yearly: 0 }
        quarterlyLoading: false,
        loading: false,
        graphLoading: false,
        error: null,
    },
    reducers: {
        setLoading:        (state) => { state.loading = true; state.error = null; },
        setDashboardData:  (state, action) => {
            state.loading        = false;
            state.stats          = action.payload.stats;
            state.recentProducts = action.payload.recentProducts;
            state.totalStock     = action.payload.totalStock;
        },
        setError:          (state, action) => { state.loading = false; state.error = action.payload; },
        setOrderCounts:    (state, action) => { state.orderCounts = action.payload; },
        setGraphLoading:   (state) => { state.graphLoading = true; },
        setMonthlyData:    (state, action) => { state.graphLoading = false; state.monthlyData = action.payload; },
        setMonthlySalesData: (state, action) => { state.monthlySalesData = action.payload; },
        setGraphError:     (state) => { state.graphLoading = false; },
        setQuarterlyLoading: (state) => { state.quarterlyLoading = true; },
        setQuarterlySalesData: (state, action) => { state.quarterlyLoading = false; state.quarterlySalesData = action.payload; },
        setQuarterlyError: (state) => { state.quarterlyLoading = false; },
    },
});

export const { setLoading, setDashboardData, setError, setOrderCounts, setGraphLoading, setMonthlyData, setMonthlySalesData, setGraphError, setQuarterlyLoading, setQuarterlySalesData, setQuarterlyError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
