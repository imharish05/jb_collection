import api from "../../api/axios";
import { setSettings, setLoading, setError } from "../slices/settings-slice";

export const fetchSettings = async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const res = await api.get("/settings");
    dispatch(setSettings(res.data || {}));
  } catch (err) {
    console.error("Unable to fetch settings", err);
    dispatch(setError(err.message));
  }
};
