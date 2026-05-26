import api from "../../api/axiosInstance";
import { setLoading, setItems, setError, addItem, updateItem, removeItem } from "../slices/variantsSlice";

// Build FormData when imageFile is present, otherwise send JSON
function buildPayload(data) {
  if (data.imageFile instanceof File) {
    const fd = new FormData();
    fd.append("productId",   data.productId);
    fd.append("variantName", data.variantName);
    fd.append("mrp",         data.mrp);
    fd.append("salesPrice",  data.salesPrice);
    fd.append("stock",       data.stock);
    fd.append("status",      data.status || "Active");
    fd.append("attributes",  JSON.stringify(data.attributes || []));
    fd.append("image",       data.imageFile);
    return { payload: fd, isMultipart: true };
  }
  const { imageFile, imagePreview, ...rest } = data;
  return { payload: { ...rest, attributes: JSON.stringify(data.attributes || []) }, isMultipart: false };
}

export const fetchVariants = () => async (dispatch) => {
    dispatch(setLoading());
    try {
        const res = await api.get("/variants");
        dispatch(setItems(res.data));
    } catch (err) {
        const msg = err.response?.data?.message || "Failed to load variants";
        dispatch(setError(msg));
        throw err;
    }
};

export const createVariant = (data) => async (dispatch) => {
    try {
        const { payload, isMultipart } = buildPayload(data);
        const config = isMultipart ? { headers: { "Content-Type": "multipart/form-data" } } : {};
        const res = await api.post("/variants/add", payload, config);
        dispatch(addItem(res.data));
    } catch (err) {
        throw err;
    }
};

export const editVariant = ({ id, data }) => async (dispatch) => {
    try {
        const { payload, isMultipart } = buildPayload(data);
        const config = isMultipart ? { headers: { "Content-Type": "multipart/form-data" } } : {};
        const res = await api.put(`/variants/update/${id}`, payload, config);
        dispatch(updateItem(res.data));
    } catch (err) {
        throw err;
    }
};

export const removeVariant = (id) => async (dispatch) => {
    try {
        await api.delete(`/variants/${id}`);
        dispatch(removeItem(id));
    } catch (err) {
        throw err;
    }
};