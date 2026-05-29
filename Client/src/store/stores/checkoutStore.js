import { store } from "../store";
import {
  createCheckoutFromCart,
  createBuyNowCheckout,
  clearCheckout,
  replaceCheckoutItems,
} from "../slices/checkout-slice";
import { replaceCart } from "../slices/cart-slice";
import api from "../../api/axios";

export const checkoutStore = {
  /**
   * Select checkout session state from Redux store.
   */
  getSession() {
    return store.getState().checkout || {};
  },

  /**
   * Create a secure checkout snapshot from the active long-term cart items.
   */
  createCheckoutFromCart(cartItems) {
    store.dispatch(createCheckoutFromCart(cartItems));
  },

  /**
   * Create an isolated, single-product temporary checkout session for "Buy Now".
   * This leaves the long-term cart completely untouched.
   */
  createBuyNowCheckout(buyNowItem) {
    store.dispatch(createBuyNowCheckout(buyNowItem));
  },

  /**
   * Clear all active checkout session items and identifiers.
   */
  clearCheckout() {
    store.dispatch(clearCheckout());
  },

  /**
   * Revalidate all items in the active checkout session against live DB inventories.
   */
  async validateCheckout(checkoutItems) {
    const items = checkoutItems || this.getSession().items || [];
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
      console.error("Checkout validation failed:", err);
      throw err;
    }
  },

  /**
   * Synchronize checkout items with the latest validated inventory, automatically
   * adjusting quantities or removing out-of-stock items. Also updates the cart
   * if the source was the long-term cart to prevent discrepancies.
   */
  async syncCheckoutInventory() {
    const session = this.getSession();
    const checkoutItems = session.items || [];
    if (checkoutItems.length === 0) return { hasChanges: false, isStillValid: false };

    try {
      const { hasChanges, items: results } = await this.validateCheckout(checkoutItems);
      if (!hasChanges) return { hasChanges: false, isStillValid: true };

      // Filter OOS / Unavailable items and adjust quantities
      const updatedCheckout = checkoutItems
        .map((item) => {
          const result = results.find((r) => r.cartItemId === item.cartItemId);
          if (!result || result.status === "OK") return item;
          if (result.adjustedQty === 0) return null; // out of stock, remove
          return { ...item, quantity: result.adjustedQty };
        })
        .filter(Boolean);

      // Dispatch changes to checkout session store
      store.dispatch(replaceCheckoutItems(updatedCheckout));

      // If the checkout session originated from the long-term cart, sync the cart too
      if (session.source === "cart") {
        const cartItems = store.getState().cart?.cartItems || [];
        const updatedCart = cartItems
          .map((item) => {
            const result = results.find((r) => r.cartItemId === item.cartItemId);
            if (!result || result.status === "OK") return item;
            if (result.adjustedQty === 0) return null;
            return { ...item, quantity: result.adjustedQty };
          })
          .filter(Boolean);
        store.dispatch(replaceCart(updatedCart));
      }

      const isStillValid = updatedCheckout.length > 0;
      return { hasChanges: true, isStillValid };
    } catch (err) {
      console.error("Failed to sync checkout inventory:", err);
      return { hasChanges: false, isStillValid: checkoutItems.length > 0 };
    }
  },

  /**
   * Handle checkout session expiration. Clears the session safely.
   */
  handleCheckoutExpiration() {
    this.clearCheckout();
  },
};
