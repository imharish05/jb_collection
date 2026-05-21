import cogoToast from "cogo-toast";
import api from "../../api/axios";
import { addToCompare, deleteFromCompare } from "../slices/compare-slice";

export const addToCompareService = async (dispatch, product) => {
    try {
        const res = await api.post("/compare/add", product);
        dispatch(addToCompare(res.data.item));
    } catch (err) {
        cogoToast.error("Could not add to compare", { position: "top-center" });
        console.log(err);
    }
};

export const deleteFromCompareService = async (dispatch, productId) => {
    try {
        await api.delete(`/compare/remove/${productId}`);
        dispatch(deleteFromCompare(productId));
    } catch (err) {
        cogoToast.error("Could not remove from compare", { position: "top-center" });
        console.log(err);
    }
};

