import { createSlice } from "@reduxjs/toolkit";

const offerSlice = createSlice({
  name: "offerBanner",
  initialState: {
    banners: [
      { id: 1, title: "Divine Decor",  off: "NEW ARRIVAL", image: "/assets/img/products/products-1.jpeg", link: "/shop" },
      { id: 2, title: "Gift Hampers",  off: "FLAT 20% OFF", image: "/assets/img/products/products-2.jpeg" , link: "/shop" },
      { id: 3, title: "Jewellery",     off: "TRENDING",     image:"/assets/img/products/products-3.jpeg" , link: "/shop" },
    ],
    loading: false,
  },
  reducers: {
    setBanners:  (state, action) => { state.banners  = action.payload; },
    setLoading:  (state, action) => { state.loading  = action.payload; },
  },
});

export const { setBanners, setLoading } = offerSlice.actions;
export default offerSlice.reducer;
