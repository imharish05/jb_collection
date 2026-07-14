import api from "../../api/axios";
import { setBrands, setLoading } from "../slices/brandsSlice";

export const fetchBrands = () => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const res = await api.get("/brands");
    // Filter only active brands
    const active = (res.data || []).filter(b => b.isActive !== false);
    dispatch(setBrands(active));
  } catch (err) {
    console.error("[brandsService] fetchBrands failed:", err.message);
    dispatch(setBrands([]));
  } finally {
    dispatch(setLoading(false));
  }
};
