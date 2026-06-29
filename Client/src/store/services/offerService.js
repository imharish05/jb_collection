import cogoToast from "cogo-toast";
import api from "../../api/axios";
import { setBanners } from "../slices/offerSlice";

export const getOfferBanners = async (dispatch) => {
  try {
    const res = await api.get("/offer-banners");
    dispatch(setBanners(res.data));
  } catch (err) {
    cogoToast.error("Unable to fetch banners", { position: "top-center" });
    console.log(err);
  }
};
