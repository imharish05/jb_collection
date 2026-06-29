import cogoToast from "cogo-toast";
import api from "../../api/axios";
import { store } from "../store";
import { setHeaderSlides } from "../slices/headerSliderSlice";

export const getHeroSlides = async () => {
    try {
        const res = await api.get("/hero-slides");
        store.dispatch(setHeaderSlides(res.data));
    } catch (err) {
        cogoToast.error("Unable to fetch hero slides", { position: "top-center" });
        console.log(err);
    }
};
