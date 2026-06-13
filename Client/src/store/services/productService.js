import cogoToast from "cogo-toast";
import api from "../../api/axios";
import { store } from "../store";
import { setProducts } from "../slices/product-slice";

/**
 * Fetch all products from server and update Redux store.
 * Called on App load and after successful order placement.
 */
export const getAllProducts = async () => {
  try {
    const res = await api.get("/products");
    store.dispatch(setProducts(res.data));
    return res.data;
  } catch (err) {
    cogoToast.error("Unable to fetch products", { position: "top-center" });
    console.error("[productService] getAllProducts failed:", err);
    return null;
  }
};

/**
 * Silently refresh product list in background (no error toast).
 * Use this after order placement to sync stock without disrupting UX.
 */
export const refreshProductsSilently = async () => {
  try {
    const res = await api.get("/products");
    store.dispatch(setProducts(res.data));
    return res.data;
  } catch (err) {
    // Silent — do not show toast for background refresh
    console.warn("[productService] Background refresh failed:", err.message);
    return null;
  }
};

/**
 * Fetch a single product by ID and update it in the Redux store.
 * Used to sync stock for a specific product without refetching all.
 */
export const refreshSingleProduct = async (productId) => {
  try {
    const res = await api.get(`/products/${productId}`);
    const updatedProduct = res.data;
    // Patch the single product in the existing store
    const current = store.getState().product?.products || [];
    const updated = current.map((p) =>
      String(p.id) === String(productId) ? { ...p, ...updatedProduct } : p
    );
    store.dispatch(setProducts(updated));
    return updatedProduct;
  } catch (err) {
    console.warn("[productService] refreshSingleProduct failed:", err.message);
    return null;
  }
};