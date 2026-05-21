import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  addresses:      [],    // only the logged-in user's addresses
  activeAddressId: null, // selected address (checkout etc.)
  loading:         false,
  error:           null,
};

const addressSlice = createSlice({
  name: "address",
  initialState,
  reducers: {

    addressStart: (state) => {
      state.loading = true;
      state.error   = null;
    },

    addressFailure: (state, action) => {
      state.loading = false;
      state.error   = action.payload;
    },

    // ── Replace the entire list (called after GET /address) ─────────────────
    // The backend already filters by userId, so this list belongs to one user.
    setAddresses: (state, action) => {
      state.loading   = false;
      state.addresses = action.payload;

      // Keep activeAddressId valid after a fresh fetch
      const stillExists = state.addresses.some((a) => a.id === state.activeAddressId);
      if (!stillExists) {
        const def = state.addresses.find((a) => a.isDefault);
        state.activeAddressId = def?.id ?? state.addresses[0]?.id ?? null;
      }
    },

    // ── Add a new address to the top of the list ─────────────────────────────
    addAddress: (state, action) => {
      state.loading = false;
      const newAddr = action.payload;

      if (newAddr.isDefault) {
        // Clear isDefault on all existing entries in the slice
        state.addresses = state.addresses.map((a) => ({ ...a, isDefault: false }));
        state.activeAddressId = newAddr.id;
      }

      state.addresses.unshift(newAddr); // newest first

      // Auto-activate if this is the very first address
      if (state.addresses.length === 1) {
        state.activeAddressId = newAddr.id;
      }
    },

    // ── Replace one address in the list ──────────────────────────────────────
    updateAddress: (state, action) => {
      state.loading = false;
      const updated = action.payload;

      if (updated.isDefault) {
        // Reflect the backend change — only this address is default now
        state.addresses = state.addresses.map((a) =>
          a.id === updated.id ? updated : { ...a, isDefault: false }
        );
        state.activeAddressId = updated.id;
      } else {
        state.addresses = state.addresses.map((a) =>
          a.id === updated.id ? updated : a
        );
      }
    },

    // ── Remove an address from the list ──────────────────────────────────────
    removeAddress: (state, action) => {
      state.loading   = false;
      const removedId = action.payload;
      state.addresses = state.addresses.filter((a) => a.id !== removedId);

      // If the removed address was the active one, pick a new active
      if (state.activeAddressId === removedId) {
        const def = state.addresses.find((a) => a.isDefault);
        state.activeAddressId = def?.id ?? state.addresses[0]?.id ?? null;
      }
    },

    // ── Select an address (e.g. at checkout) ─────────────────────────────────
    setActiveAddress: (state, action) => {
      state.activeAddressId = action.payload;
    },

    // ── IMPORTANT: Call this on logout ───────────────────────────────────────
    // Wipes the state so the next user who logs in starts with a clean slate
    // and never sees a previous user's addresses.
    clearAddresses: (state) => {
      state.addresses       = [];
      state.activeAddressId = null;
      state.loading         = false;
      state.error           = null;
    },
  },
});

export const {
  addressStart,
  addressFailure,
  setAddresses,
  addAddress,
  updateAddress,
  removeAddress,
  setActiveAddress,
  clearAddresses,
} = addressSlice.actions;

export default addressSlice.reducer;