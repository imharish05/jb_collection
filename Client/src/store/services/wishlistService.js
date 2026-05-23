import cogoToast from "cogo-toast";
import api from "../../api/axios";
import { store } from "../store";
import { addToWishlist, deleteFromWishlist, deleteAllFromWishlist } from "../slices/wishlist-slice";

// Normalize server product to match product-slice shape (Variants capital V)
const normalizeWishlistProduct = (p) => ({
    ...p,
    Variants: Array.isArray(p.Variants) ? p.Variants
            : Array.isArray(p.variants) ? p.variants
            : [],
});

export const addToWishlistService = async (product) => {
    try {
        const res = await api.post("/wishlist/add", {
            productId: product.productId || product.id
        });

        console.log(res.data);

        if (res.data?.item?.product) {
            store.dispatch(addToWishlist(normalizeWishlistProduct({
                ...res.data.item.product,
                wishlistItemId: res.data.item.id
            })));
        } else {
            store.dispatch(addToWishlist(normalizeWishlistProduct(product)));
        }
        cogoToast.success("Added to wishlist!", { position: "top-center" });
    } catch (err) {
        if (err.response?.status === 409) {
            cogoToast.info("Already in your wishlist", { position: "top-center" });
        } else {
            cogoToast.error("Could not add to wishlist", { position: "top-center" });
        }
        console.log(err);
    }
};

export const deleteFromWishlistService = async (productId) => {
    try {
        await api.delete(`/wishlist/remove/${productId}`);
        store.dispatch(deleteFromWishlist(productId));
        cogoToast.success("Removed from wishlist", { position: "top-center" });
    } catch (err) {
        cogoToast.error("Could not remove from wishlist", { position: "top-center" });
        console.log(err);
    }
};

// Fetch wishlist from server and hydrate Redux (call after login or on page refresh)
export const loadWishlistService = async () => {
    try {
        const res = await api.get("/wishlist");
        if (Array.isArray(res.data)) {
            store.dispatch(deleteAllFromWishlist());
            res.data.forEach(item => {
                if (item.product) {
                    store.dispatch(addToWishlist(normalizeWishlistProduct({
                        ...item.product,
                        wishlistItemId: item.id,
                    })));
                }
            });
        }
    } catch (err) {
        console.log("Could not load wishlist:", err);
    }
};

export const deleteAllFromWishlistService = async () => {
    try {
        await api.delete("/wishlist/clear");
        store.dispatch(deleteAllFromWishlist());
    } catch (err) {
        cogoToast.error("Could not clear wishlist", { position: "top-center" });
        console.log(err);
    }
};