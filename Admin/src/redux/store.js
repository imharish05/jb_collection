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
import newCombosReducer       from "./slices/newComboSlice";   // ← new
import paymentsReducer        from "./slices/paymentsSlice";
// ── Marketing ────────────────────────────────────────────────
import heroSliderReducer       from "./slices/heroSliderSlice";
import timelessTreasuresReducer from "./slices/timelessTreasuresSlice";
import marqueeReducer          from "./slices/marqueeSlice";
import testimonialsReducer    from "./slices/testimonialsSlice";
import notificationsReducer  from "./slices/notificationsSlice";
import timelineReducer       from "./slices/timelineSlice";
import deliveryZonesReducer  from "./slices/deliveryZonesSlice";

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
    newCombos:         newCombosReducer,           // ← new
    payments:          paymentsReducer,
    // Marketing
    heroSlider:        heroSliderReducer,
    timelessTreasures: timelessTreasuresReducer,
    marquee:           marqueeReducer,
    testimonials:      testimonialsReducer,
    notifications:     notificationsReducer,
    timeline:          timelineReducer,
    deliveryZones:     deliveryZonesReducer,
  },
});
