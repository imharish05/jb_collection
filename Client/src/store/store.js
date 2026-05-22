import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
    persistStore,
    persistReducer,
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import productReducer from './slices/product-slice';
import cartReducer from "./slices/cart-slice";
import compareReducer from "./slices/compare-slice";
import wishlistReducer from "./slices/wishlist-slice";
import currencyReducer from "./slices/currency-slice";
import marqueeReducer from "./slices/heroMarqueeSlice"
import sliderReducer from "./slices/headerSliderSlice"
import navMenuReducer from './slices/navMenuSlice';
import offerReducer from './slices/offerSlice';
import authReducer from "./slices/authSlice"
import addressReducer from "./slices/addressSlice"
import orderReducer from "./slices/order-slice"

const persistConfig = {
    key: "flone",
    version: 1.1,
    storage,
    blacklist: ["product","navMenu", "headerSlider"]
}

export const rootReducer = combineReducers({
    marquee : marqueeReducer,
    headerSlider : sliderReducer,
    product: productReducer,
    cart: cartReducer,
    compare: compareReducer,
    wishlist: wishlistReducer,
    currency: currencyReducer,
    navMenu: navMenuReducer,
    offerBanner: offerReducer,
    auth : authReducer,
    address: addressReducer,
    order: orderReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    FLUSH,
                    REHYDRATE,
                    PAUSE,
                    PERSIST,
                    PURGE,
                    REGISTER,
                ],
            },
        }),
});

export const persistor = persistStore(store);
