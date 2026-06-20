import cogoToast from "cogo-toast";
import api from "../../api/axios";
import { addToCart, addToCartSilent, increaseQuantity, deleteFromCart, decreaseQuantity, deleteAllFromCart } from "../slices/cart-slice";
import { store } from "../store";

/**
 * Check auth before any cart mutation.
 */
const requireAuth = (redirectPath = "/cart") => {
  const state = store.getState();
  const isAuthenticated = state.auth?.isAuthenticated;

  if (!isAuthenticated) {
    cogoToast.warn("Please login to continue", { position: "top-center" });
    const redirect = encodeURIComponent(redirectPath);
    window.location.href = `${process.env.PUBLIC_URL}/login?redirect=${redirect}`;
    return false;
  }
  return true;
};

const addToCartBaseService = async (dispatchOrProduct, optionalProduct, silent = false) => {
  let dispatch = store.dispatch;
  let product = dispatchOrProduct;

  if (typeof dispatchOrProduct === "function") {
    dispatch = dispatchOrProduct;
    product = optionalProduct;
  }

  if (!requireAuth(window.location.pathname)) return false;

  try {
    const payload = {
      productId: product.productId || product.id,
      quantity: product.quantity || 1,
      selectedProductColor: product.selectedProductColor || null,
      selectedProductSize: product.selectedProductSize || null,
      selectedVariantId: product.selectedVariantId || null,
      selectedVariantName: product.selectedVariantName || null,
      customisationDetails: product.customisationDetails || null,
    };

    const res = await api.post("/cart/add", payload);
    const cartItem = res.data.cartItem;

    // Resolve variant stock — prefer matched variant, fall back to product stock
    const variants = cartItem.product?.Variants || cartItem.product?.variants || product.Variants || [];
    const matchedVariant = variants.find(v => String(v.id) === String(cartItem.selectedVariantId));
    const resolvedStock = matchedVariant?.stock ?? cartItem.product?.stock ?? product.stock ?? 999;
    const resolvedPrice = matchedVariant?.salesPrice ?? cartItem.productSnapshot?.price ?? cartItem.product?.price ?? product.price;
    const resolvedDiscount = cartItem.productSnapshot?.discount ?? cartItem.product?.discount ?? product.discount ?? 0;

    const formattedProduct = {
      id: cartItem.productId,
      cartItemId: cartItem.id,
      quantity: cartItem.quantity,
      selectedProductColor: cartItem.selectedProductColor,
      selectedProductSize: cartItem.selectedProductSize,
      selectedVariantId: cartItem.selectedVariantId != null ? Number(cartItem.selectedVariantId) : null,
      selectedVariantName: cartItem.productSnapshot?.selectedVariantName || product.selectedVariantName || null,
      selectedVariant: matchedVariant || null,   // ← full variant object (same as wishlist)
      name: cartItem.productSnapshot?.name || cartItem.product?.name || product.name,
      price: typeof resolvedPrice === "string" ? parseFloat(resolvedPrice) : resolvedPrice,
      discount: typeof resolvedDiscount === "string" ? parseFloat(resolvedDiscount) : resolvedDiscount,
      image: matchedVariant?.image || cartItem.productSnapshot?.image || cartItem.product?.image || product.image || [],
      variation: cartItem.product?.variation || product.variation || [],
      stock: resolvedStock,
      Variants: variants,
      isPartialCodAvailable: cartItem.product?.isPartialCodAvailable !== false,
      customisationDetails: cartItem.customisationDetails || null,
      customisationFields: cartItem.product?.customisationFields || null,
    };

    if (silent) {
      dispatch(addToCartSilent(formattedProduct));
    } else {
      dispatch(addToCart(formattedProduct));
    }
    return true;
  } catch (err) {
    cogoToast.error("Could not add to cart", { position: "top-center" });
    console.log(err);
    return false;
  }
};

export const addToCartService = (dispatchOrProduct, optionalProduct) => {
  return addToCartBaseService(dispatchOrProduct, optionalProduct, false);
};

export const addToCartSilentService = (dispatchOrProduct, optionalProduct) => {
  return addToCartBaseService(dispatchOrProduct, optionalProduct, true);
};

export const deleteFromCartService = async (cartItemId) => {
  const dispatch = store.dispatch;
  if (!requireAuth()) return;

  try {
    await api.delete(`/cart/remove/${cartItemId}`);
    dispatch(deleteFromCart(cartItemId));
  } catch (err) {
    cogoToast.error("Could not remove item", { position: "top-center" });
    console.log(err);
  }
};

export const increaseQuantityService = async (product) => {
  const dispatch = store.dispatch;
  if (!requireAuth()) return;

  try {
    await api.patch(`/cart/increase/${product.cartItemId}`);
    dispatch(increaseQuantity({ cartItemId: product.cartItemId }));
  } catch (err) {
    cogoToast.error("Could not update quantity", { position: "top-center" });
    console.log(err);
  }
};

export const decreaseQuantityService = async (dispatchOrProduct, optionalProduct) => {
  let dispatch = store.dispatch;
  let product = dispatchOrProduct;

  if (typeof dispatchOrProduct === "function") {
    dispatch = dispatchOrProduct;
    product = optionalProduct;
  }

  if (!requireAuth()) return;

  try {
    await api.patch(`/cart/decrease/${product.cartItemId}`);
    dispatch(decreaseQuantity(product));
  } catch (err) {
    cogoToast.error("Could not update quantity", { position: "top-center" });
    console.log(err);
  }
};

export const deleteAllFromCartService = async (dispatch) => {
  let activeDispatch = typeof dispatch === "function" ? dispatch : store.dispatch;
  if (!requireAuth()) return;

  try {
    await api.delete("/cart/clear");
    activeDispatch(deleteAllFromCart());
  } catch (err) {
    cogoToast.error("Could not clear cart", { position: "top-center" });
    console.log(err);
  }
};