import cogoToast from "cogo-toast";
import api from "../../api/axios";
import { store } from "../store";
import { addToWishlist, deleteFromWishlist, deleteAllFromWishlist } from "../slices/wishlist-slice";

// ── Normalize a product object from the server ────────────────────────────────
// Ensures Variants is always an array with capital V (matches cart/product slices).
const normalizeProduct = (p) => ({
  ...p,
  Variants: Array.isArray(p.Variants) ? p.Variants
          : Array.isArray(p.variants)  ? p.variants
          : [],
});

// ── Build a Redux wishlist item from a raw WishlistItem row returned by GET/POST
// Shape stored in Redux:
//   { ...productFields, wishlistItemId, selectedVariantId, selectedVariant }
const buildWishlistEntry = (row) => {
  if (!row.product) return null;
  const product = normalizeProduct(row.product);
  const variantId = row.variantId ?? null;

  // Find the specific variant object so the wishlist page can show its price/attrs
  const selectedVariant = variantId != null
    ? (product.Variants || []).find(v => String(v.id) === String(variantId)) || null
    : null;

  return {
    ...product,
    wishlistItemId:    row.id,           // UUID of WishlistItem row — used for DELETE
    selectedVariantId: variantId,        // INTEGER variant id (or null)
    selectedVariant:   selectedVariant,  // full variant object (or null)
  };
};

// POST /api/wishlist/add  — expects { productId, variantId? }
export const addToWishlistService = async (product, variantId = null) => {
  try {
    const res = await api.post("/wishlist/add", {
      productId: product.productId || product.id,
      variantId: variantId ?? null,
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
    cogoToast.success("Removed from wishlist", { position: "top-center" });
  } catch (err) {
    cogoToast.error("Could not remove from wishlist", { position: "top-center" });
    console.error(err);
  }
};

// GET /api/wishlist — hydrate Redux on login / page load
export const loadWishlistService = async () => {
  try {
    const res = await api.get("/wishlist");
    if (Array.isArray(res.data)) {
      store.dispatch(deleteAllFromWishlist());
      res.data.forEach(row => {
        const entry = buildWishlistEntry(row);
        if (entry) store.dispatch(addToWishlist(entry));
      });
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
