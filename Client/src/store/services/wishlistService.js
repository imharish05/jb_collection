import cogoToast from "cogo-toast";
import api from "../../api/axios";
import { store } from "../store";
import { addToWishlist, deleteFromWishlist, deleteAllFromWishlist } from "../slices/wishlist-slice";

export const addToWishlistService = async (product) => {
    try {
        const res = await api.post("/wishlist/add", {
            productId: product.productId || product.id
        });
        
        if (res.data?.item?.product) {
            store.dispatch(addToWishlist({
                ...res.data.item.product,
                wishlistItemId: res.data.item.id
            }));
        } else {
            store.dispatch(addToWishlist(product));
        }
    } catch (err) {
        cogoToast.error("Could not add to wishlist", { position: "top-center" });
        console.log(err);
    }
};

export const deleteFromWishlistService = async (productId) => {
    try {
        await api.delete(`/wishlist/remove/${productId}`);
        store.dispatch(deleteFromWishlist(productId));
    } catch (err) {
        cogoToast.error("Could not remove from wishlist", { position: "top-center" });
        console.log(err);
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

