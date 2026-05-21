import { configureStore } from "@reduxjs/toolkit";
import categoriesReducer      from "./slices/categoriesSlice";
import brandsReducer          from "./slices/brandsSlice";
import productsReducer        from "./slices/productsSlice";
import variantsReducer        from "./slices/variantsSlice";
import customersReducer       from "./slices/customersSlice";
import reviewsReducer         from "./slices/reviewsSlice";
import couponsReducer         from "./slices/couponsSlice";
import ordersReducer          from "./slices/ordersSlice";
import dashboardReducer       from "./slices/dashboardSlice";
import contactsReducer        from "./slices/contactsSlice";
import eventsReducer          from "./slices/eventSlice";
import combosReducer          from "./slices/comboSlice";
// ── Marketing ────────────────────────────────────────────────
import heroSliderReducer       from "./slices/heroSliderSlice";
import timelessTreasuresReducer from "./slices/timelessTreasuresSlice";
import marqueeReducer          from "./slices/marqueeSlice";

export const store = configureStore({
  reducer: {
    categories:        categoriesReducer,
    brands:            brandsReducer,
    products:          productsReducer,
    variants:          variantsReducer,
    customers:         customersReducer,
    reviews:           reviewsReducer,
    coupons:           couponsReducer,
    orders:            ordersReducer,
    dashboard:         dashboardReducer,
    contacts:          contactsReducer,
    events:            eventsReducer,
    combos:            combosReducer,
    // Marketing
    heroSlider:        heroSliderReducer,
    timelessTreasures: timelessTreasuresReducer,
    marquee:           marqueeReducer,
  },
});