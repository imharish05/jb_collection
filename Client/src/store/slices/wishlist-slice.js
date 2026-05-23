import cogoToast from 'cogo-toast';
const { createSlice } = require('@reduxjs/toolkit');

// Two wishlist entries are the SAME only when both productId AND variantId match.
// variantId=null means "no variant" (product has no variants).
const isSameEntry = (item, payload) => {
  if (item.id !== payload.id) return false;
  const a = item.selectedVariantId ?? null;
  const b = payload.selectedVariantId ?? null;
  return a === b;
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: { wishlistItems: [] },
  reducers: {
    addToWishlist(state, action) {
      const already = state.wishlistItems.some(item => isSameEntry(item, action.payload));
      if (already) {
        cogoToast.info("Already in your wishlist", { position: "top-center" });
      } else {
        state.wishlistItems.push(action.payload);
        cogoToast.success("Added to wishlist!", { position: "top-center" });
      }
    },
    // action.payload = wishlistItemId (UUID of the WishlistItem row)
    deleteFromWishlist(state, action) {
      state.wishlistItems = state.wishlistItems.filter(
        item => item.wishlistItemId !== action.payload
      );
      cogoToast.error("Removed from wishlist", { position: "top-center" });
    },
    deleteAllFromWishlist(state) {
      state.wishlistItems = [];
    },
  },
});

export const { addToWishlist, deleteFromWishlist, deleteAllFromWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
