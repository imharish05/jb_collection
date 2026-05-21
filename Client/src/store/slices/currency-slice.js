const { createSlice } = require('@reduxjs/toolkit');

const currencySlice = createSlice({
    name: "currency",
    initialState: {
        currencyName: "INR",
        currencyRate: 1,
        currencySymbol: "₹"
    },
    reducers: {
        setCurrency(state, action) {
            // Since only INR is supported, do nothing or set to INR
            state.currencyName = "INR";
            state.currencyRate = 1;
            state.currencySymbol = "₹";
        }
    }
});

export const { setCurrency } = currencySlice.actions;
export default currencySlice.reducer;
