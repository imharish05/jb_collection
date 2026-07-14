import cogoToast from "cogo-toast";
import { setCategories, setEvents, setCombos, setRootCombos } from "../slices/navMenuSlice";
import { setBrands } from "../slices/brandsSlice";
import api from "../../api/axios";

export const getNavCategories = async (dispatch) => {
  try {
    const res = await api.get("/nav/categories");

    const { categories, events, combos } = res.data.data;
    
    dispatch(setCategories(categories)); 
    dispatch(setEvents(events));
    dispatch(setCombos(combos));

    try {
      const resCombos = await api.get("/combos");
      dispatch(setRootCombos(resCombos.data?.data || []));
    } catch (comboErr) {
      console.error("Unable to fetch root combos:", comboErr);
      dispatch(setRootCombos([]));
    }

    // Fetch active brands for client-side filtering
    try {
      const resBrands = await api.get("/brands");
      const activeBrands = (resBrands.data || []).filter(b => b.isActive !== false);
      dispatch(setBrands(activeBrands));
    } catch (brandErr) {
      console.error("Unable to fetch brands:", brandErr);
      dispatch(setBrands([]));
    }

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
