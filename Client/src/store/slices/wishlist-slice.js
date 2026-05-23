import cogoToast from 'cogo-toast';
const { createSlice } = require('@reduxjs/toolkit');

// Same entry = same productId (item.id) AND same variantId.
// Both sides normalized to Number to prevent string/integer type mismatch
// (Sequelize INTEGER columns may serialize differently over HTTP vs Redux persist).
const isSameEntry = (item, payload) => {
  if (item.id !== payload.id) return false;
  const a = item.selectedVariantId != null ? Number(item.selectedVariantId) : null;
  const b = payload.selectedVariantId != null ? Number(payload.selectedVariantId) : null;
  return a === b;
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: { wishlistItems: [] },
  reducers: {

    // ── User-initiated add — runs dedup check, shows toasts ──────────────────
    addToWishlist(state, action) {
      const already = state.wishlistItems.some(item => isSameEntry(item, action.payload));
      if (already) {
        cogoToast.info("Already in your wishlist", { position: "top-center" });
      } else {
        state.wishlistItems.push(action.payload);
        cogoToast.success("Added to wishlist!", { position: "top-center" });
      }
    },

    // ── Silent bulk replace — used by loadWishlistService, NO toasts ─────────
    // Replaces entire wishlist state without any dedup checks or toasts.
    // Required because wishlist is redux-persist'd: on page refresh the persisted
    // items are already in state; calling addToWishlist one-by-one would trigger
    // "Already in your wishlist" toasts for every item.
    setWishlist(state, action) {
      state.wishlistItems = Array.isArray(action.payload) ? action.payload : [];
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

export const {
  addToWishlist,
  setWishlist,
  deleteFromWishlist,
  deleteAllFromWishlist,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;