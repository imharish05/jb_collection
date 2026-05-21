import cogoToast from "cogo-toast";
import api from "../../api/axios";
import { setBlogs } from "../slices/blog-slice";

export const getBlogs = async (dispatch) => {
    try {
        const res = await api.get("/blogs");
        dispatch(setBlogs.fulfilled(res.data));
    } catch (err) {
        cogoToast.error("Unable to fetch blogs", { position: "top-center" });
        console.log(err);
    }
};

