import cogoToast from "cogo-toast";
import api from "../../api/axios";
import { setTestimonials, setLoading, setError } from "../slices/testimonialSlice";

export const fetchTestimonials = async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const res = await api.get("/testimonials");
    dispatch(setTestimonials(res.data));
  } catch (err) {
    cogoToast.error("Unable to fetch testimonials", { position: "top-center" });
    dispatch(setError(err.message));
    console.log(err);
  }
};
