import cogoToast from "cogo-toast";
import api from "../../api/axios";
import { store } from "../store";
import { setMessages } from "../slices/heroMarqueeSlice";

export const getMarqueeMessages = async () => {
    try {
        const res = await api.get("/marquee");
        store.dispatch(setMessages(res.data));
    } catch (err) {
        cogoToast.error("Unable to fetch marquee messages", { position: "top-center" });
        console.log(err);
    }
};

