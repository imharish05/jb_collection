import api from "../../api/axiosInstance";

export const getShippingSettings = async () => {
  const res = await api.get("/shipping/settings");
  return res.data;
};

export const updateShippingSettings = async (payload) => {
  const res = await api.put("/shipping/settings", payload);
  return res.data;
};

export const getDeliveryZones = async () => {
  const res = await api.get("/shipping/zones");
  return res.data;
};

export const createDeliveryZone = async (payload) => {
  const res = await api.post("/shipping/zones", payload);
  return res.data;
};

export const updateDeliveryZone = async (id, payload) => {
  const res = await api.put(`/shipping/zones/${id}`, payload);
  return res.data;
};

export const deleteDeliveryZone = async (id) => {
  const res = await api.delete(`/shipping/zones/${id}`);
  return res.data;
};

export const importZonePincodes = async (id, pincodes) => {
  const res = await api.post(`/shipping/zones/${id}/pincodes/import`, { pincodes });
  return res.data;
};

export const checkServiceability = async (params) => {
  const query = new URLSearchParams(params).toString();
  const res = await api.get(`/shipping/serviceability?${query}`);
  return res.data;
};

