import cogoToast from "cogo-toast";
import { setCategories, setEvents,setCombos } from "../slices/navMenuSlice";
import api from "../../api/axios";

export const getNavCategories = async (dispatch) => {
  try {
    const res = await api.get("/nav/categories");

    const { categories, events, combos } = res.data.data;
    
    dispatch(setCategories(categories)); 
    dispatch(setEvents(events));
    dispatch(setCombos(combos));

    console.log(res.data.data.categories);
    
  } catch (err) {
    cogoToast.error("Unable to fetch categories", { position: "top-center" });
    console.log(err);
  }
};

export const getNavEvents = async (dispatch) => {
  try {
    const res = await api.get("/nav/events");
    dispatch(setEvents(res.data));
  } catch (err) {
    cogoToast.error("Unable to fetch events", { position: "top-center" });
    console.log(err);
  }
};