import api from "../../api/axiosInstance";
import { setLoading, setItems, setError, addItem, updateItem, removeItem } from "../slices/timelineSlice";

export const fetchMilestones = () => async (dispatch) => {
  dispatch(setLoading());
  try {
    // ?all=true so admin sees both active and inactive milestones
    const res = await api.get("/timeline?all=true");
    dispatch(setItems(res.data));
  } catch (err) {
    const msg = err.response?.data?.message || "Failed to load timeline milestones";
    dispatch(setError(msg));
    throw err;
  }
};

export const createMilestone = (formData) => async (dispatch) => {
  try {
    const res = await api.post("/timeline", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    dispatch(addItem(res.data));
  } catch (err) {
    throw err;
  }
};

export const editMilestone = ({ id, formData }) => async (dispatch) => {
  try {
    const res = await api.put(`/timeline/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    dispatch(updateItem(res.data));
  } catch (err) {
    throw err;
  }
};

export const removeMilestone = (id) => async (dispatch) => {
  try {
    await api.delete(`/timeline/${id}`);
    dispatch(removeItem(id));
  } catch (err) {
    throw err;
  }
};
