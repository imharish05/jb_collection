import cogoToast from "cogo-toast";
import api from "../../api/axios";
import { store } from "../store";
import {
  addToWishlist,
  setWishlist,
  deleteFromWishlist,
  deleteAllFromWishlist,
} from "../slices/wishlist-slice";

// Normalize server product: Variants always capital-V array
const normalizeProduct = (p) => ({
  ...p,
  Variants: Array.isArray(p.Variants) ? p.Variants
          : Array.isArray(p.variants)  ? p.variants
          : [],
});

// Build Redux entry from a raw WishlistItem DB row.
// Normalizes variantId to Number (Variant.id is INTEGER; JSON may deliver as string).
const buildWishlistEntry = (row) => {
  if (!row.product) return null;
  const product   = normalizeProduct(row.product);
  const variantId = row.variantId != null ? Number(row.variantId) : null;

  const selectedVariant = variantId != null
    ? (product.Variants || []).find(v => Number(v.id) === variantId) || null
    : null;

  return {
    ...product,
    wishlistItemId:    row.id,
    selectedVariantId: variantId,       // always Number or null
    selectedVariant:   selectedVariant, // full variant object or null
  };
};

// POST /api/wishlist/add
export const addToWishlistService = async (product, variantId = null) => {
  try {
    const res = await api.post("/wishlist/add", {
      productId: product.productId || product.id,
      variantId: variantId != null ? Number(variantId) : null,
    });

    const entry = buildWishlistEntry(res.data.item);
    if (entry) {
      store.dispatch(addToWishlist(entry));
    }
  } catch (err) {
    if (err.response?.status === 409) {
      cogoToast.info("Already in your wishlist", { position: "top-center" });
    } else {
      cogoToast.error("Could not add to wishlist", { position: "top-center" });
      console.error(err);
    }
  }
};

// DELETE /api/wishlist/remove/:wishlistItemId
export const deleteFromWishlistService = async (wishlistItemId) => {
  try {
    await api.delete(`/wishlist/remove/${wishlistItemId}`);
    store.dispatch(deleteFromWishlist(wishlistItemId));
  } catch (err) {
    cogoToast.error("Could not remove from wishlist", { position: "top-center" });
    console.error(err);
  }
};

// GET /api/wishlist — called on login/page-refresh to hydrate Redux.
// Uses setWishlist (silent replace) — never addToWishlist — so no toasts fire
// even though the items already exist in persisted Redux state.
export const loadWishlistService = async () => {
  try {
    const res = await api.get("/wishlist");
    if (Array.isArray(res.data)) {
      const entries = res.data.map(buildWishlistEntry).filter(Boolean);
      store.dispatch(setWishlist(entries));  // ← silent, no toasts
    }
  } catch (err) {
    console.error("Could not load wishlist:", err);
  }
};

// DELETE /api/wishlist/clear
export const deleteAllFromWishlistService = async () => {
  try {
    await api.delete("/wishlist/clear");
    store.dispatch(deleteAllFromWishlist());
  } catch (err) {
    cogoToast.error("Could not clear wishlist", { position: "top-center" });
    console.error(err);
  }
};
