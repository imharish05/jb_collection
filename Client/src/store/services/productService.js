import cogoToast from "cogo-toast";
import api from "../../api/axios";
import { store } from "../store";
import { setProducts } from "../slices/product-slice";

export const getAllProducts = async () => {
    try {
        const res = await api.get("/products");
        console.log(res.data)
        store.dispatch(setProducts(res.data));
    } catch (err) {
        cogoToast.error("Unable to fetch products", { position: "top-center" });
        console.log(err);
    }
};

