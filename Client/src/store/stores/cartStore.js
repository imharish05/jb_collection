import { store } from "../store";
import {
  addToCartService,
  deleteFromCartService,
  increaseQuantityService,
  decreaseQuantityService,
  deleteAllFromCartService,
} from "../services/cartService";
import api from "../../api/axios";
import { replaceCart } from "../slices/cart-slice";

export const cartStore = {
  /**
   * Get the current cart items from Redux store.
   */
  getItems() {
    return store.getState().cart?.cartItems || [];
  },

  /**
   * Add an item to the cart.
   * Runs validation, sends to backend, and updates Redux state.
   */
  async addToCart(product) {
    const dispatch = store.dispatch;
    return await addToCartService(dispatch, product);
  },

  /**
   * Remove an item from the cart by its database cartItemId.
   */
  async removeFromCart(cartItemId) {
    return await deleteFromCartService(cartItemId);
  },

  /**
   * Update the quantity of a cart item to an absolute target quantity.
   * Compares the target quantity with the current quantity and triggers
   * the appropriate sequential increment or decrement service requests.
   */
  async updateQuantity(cartItemId, newQty) {
    const items = this.getItems();
    const item = items.find((i) => i.cartItemId === cartItemId);
    if (!item) return false;

    const diff = newQty - item.quantity;
    if (diff === 0) return true;

    try {
      if (diff > 0) {
        for (let i = 0; i < diff; i++) {
          await increaseQuantityService(item);
        }
      } else {
        const absDiff = Math.abs(diff);
        for (let i = 0; i < absDiff; i++) {
          // If we decrease a quantity of 1, it will delete the item
          await decreaseQuantityService(store.dispatch, item);
        }
      }
      return true;
    } catch (err) {
      console.error("Failed to update cart quantity:", err);
      return false;
    }
  },

  /**
   * Merge guest cart items into the authenticated user's cart on login.
   * Sends items sequentially to the backend to ensure database synchronization.
   */
  async mergeCart(guestItems) {
    if (!Array.isArray(guestItems) || guestItems.length === 0) return;

    for (const item of guestItems) {
      try {
        const payload = {
          productId: item.id,
          quantity: item.quantity,
          selectedProductColor: item.selectedProductColor || null,
          selectedProductSize: item.selectedProductSize || null,
          selectedVariantId: item.selectedVariantId || null,
          selectedVariantName: item.selectedVariantName || null,
        };
        await api.post("/cart/add", payload);
      } catch (err) {
        console.warn("Failed to merge guest cart item:", item, err);
      }
    }

    // Refresh state from server
    try {
      const res = await api.get("/cart");
      const formattedItems = res.data.map(cartItem => {
        const snap = cartItem.productSnapshot || {};
        const variants = cartItem.product?.Variants || [];
        const matchedVariant = variants.find(v => String(v.id) === String(cartItem.selectedVariantId));
        return {
          id: cartItem.productId,
          cartItemId: cartItem.id,
          quantity: cartItem.quantity,
          selectedVariantId: cartItem.selectedVariantId || null,
          selectedVariantName: snap.selectedVariantName || null,
          selectedProductColor: cartItem.selectedProductColor || null,
          selectedProductSize: cartItem.selectedProductSize || null,
          name: snap.name || cartItem.product?.name,
          price: matchedVariant?.salesPrice ?? snap.price ?? cartItem.product?.price ?? 0,
          discount: snap.discount ?? cartItem.product?.discount ?? 0,
          image: snap.image || cartItem.product?.image || [],
          variation: cartItem.product?.variation || [],
          Variants: variants,
          selectedVariant: matchedVariant || null,
          isCombo: snap.isCombo || false,
          rootComboId: snap.rootComboId || null,
          childComboId: snap.childComboId || null,
          selectedProducts: snap.products || null,
        };
      });
      store.dispatch(replaceCart(formattedItems));
    } catch (syncErr) {
      console.error("Failed to sync cart after merge:", syncErr);
    }
  },

  /**
   * Persists cart to backend (implicit during operations) or clears the entire cart.
   */
  async clearCart() {
    return await deleteAllFromCartService(store.dispatch);
  },

  /**
   * Perform backend-driven revalidation on cart items.
   */
  async validateCart() {
    const items = this.getItems();
    if (items.length === 0) return { hasChanges: false, items: [] };

    try {
      const payload = {
        items: items.map((item) => ({
          cartItemId: item.cartItemId,
          productId: item.id,
          selectedVariantId: item.selectedVariantId || null,
          quantity: item.quantity,
          name: item.name,
          selectedVariantName: item.selectedVariantName || null,
          isCombo: item.isCombo || false,
          childComboId: item.childComboId || null,
          selectedProducts: item.selectedProducts || null,
        })),
      };
      const res = await api.post("/cart/revalidate", payload);
      return res.data; // { hasChanges, items }
    } catch (err) {
      console.error("Cart revalidation failed:", err);
      throw err;
    }
  },
};
