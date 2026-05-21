import api from '../../api/axiosInstance';
import { setLoading, setItems, setError, removeItem } from '../slices/comboSlice';

export const fetchCombos = () => async (dispatch) => {
  dispatch(setLoading());
  try {
    const res = await api.get('/combos');
    dispatch(setItems(res.data.data || []));
  } catch (err) {
    dispatch(setError(err.response?.data?.message || 'Failed to load combos'));
    throw err;
  }
};

export const createCombo = (formData) => async (dispatch) => {
  try {
    await api.post('/combos', formData);
    const res = await api.get('/combos');
    dispatch(setItems(res.data.data || []));
  } catch (err) { throw err; }
};

export const editCombo = ({ id, formData }) => async (dispatch) => {
  try {
    await api.patch(`/combos/${id}`, formData);
    const res = await api.get('/combos');
    dispatch(setItems(res.data.data || []));
  } catch (err) { throw err; }
};

export const removeCombo = (id) => async (dispatch) => {
  try {
    await api.delete(`/combos/${id}`);
    dispatch(removeItem(id));
  } catch (err) { throw err; }
};