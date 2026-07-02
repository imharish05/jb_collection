import api from "../../api/axiosInstance";
import { setLoading, setItems, setError, addItem, updateItem, removeItem } from "../slices/variantsSlice";

// Always use FormData so we can attach both image and gallery files
function buildPayload(data) {
  const fd = new FormData();

  if (data.productId !== undefined)         fd.append("productId",          data.productId);
  if (data.variantName !== undefined)       fd.append("variantName",        data.variantName || "Default");
  if (data.mrp !== undefined)               fd.append("mrp",                data.mrp);
  if (data.salesPrice !== undefined)        fd.append("salesPrice",         data.salesPrice);
  if (data.stock !== undefined)             fd.append("stock",              data.stock);
  if (data.status !== undefined)            fd.append("status",             data.status || "Active");
  if (data.sku !== undefined)               fd.append("sku",                data.sku || "");
  if (data.gstMode !== undefined)           fd.append("gstMode",            data.gstMode || "Inclusive");
  if (data.gstRate !== undefined)           fd.append("gstRate",            data.gstRate || "0%");
  if (data.lowStockThreshold !== undefined) fd.append("lowStockThreshold",  data.lowStockThreshold || "10");

  fd.append("attributes", JSON.stringify(data.attributes || []));

  if (data.shippingWeight) fd.append("shippingWeight", data.shippingWeight);
  if (data.shippingDimensions) {
    fd.append("shippingDimensions", typeof data.shippingDimensions === "string"
      ? data.shippingDimensions
      : JSON.stringify(data.shippingDimensions));
  }

  // Main variant image
  if (data.imageFile instanceof File) {
    fd.append("image", data.imageFile);
  }

  // Gallery sub-images (array of File objects)
  if (Array.isArray(data.galleryFiles)) {
    data.galleryFiles.forEach((file) => {
      if (file instanceof File) fd.append("gallery", file);
    });
  }

  // Retained existing gallery images
  const existingImages = (data.galleryPreviews || [])
    .filter(g => !g.file)
    .map(g => {
      const url = typeof g === 'string' ? g : g.url;
      if (!url || url.startsWith('blob:')) return null;
      if (url.startsWith('http')) {
        try {
          const pathname = new URL(url).pathname;
          return pathname.replace(/^\//, '');
        } catch { /* fall through */ }
      }
      return url.replace(/^\//, '');
    })
    .filter(Boolean);
  fd.append("existingImages", JSON.stringify(existingImages));

  return { payload: fd, isMultipart: true };
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