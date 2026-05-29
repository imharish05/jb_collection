// Client/src/store/slices/combo-slice.js
import { createSlice } from "@reduxjs/toolkit";

const comboSlice = createSlice({
  name: "combo",
  initialState: {
    rootCombos:        [],
    currentCombo:      null,   // full root with children
    loading:           false,
    error:             null,
    // mixMatchSelections: { [childComboId]: { childComboId, selections: [{productId, variantId, quantity}] } }
    mixMatchSelections: {},
  },
  reducers: {
    setLoading:     (state)              => { state.loading = true;  state.error = null; },
    setRootCombos:  (state, { payload }) => { state.loading = false; state.rootCombos = payload; },
    setCurrentCombo:(state, { payload }) => { state.loading = false; state.currentCombo = payload; },
    setError:       (state, { payload }) => { state.loading = false; state.error = payload; },

    // Mix & Match selections
    addMixMatchItem: (state, { payload: { childComboId, item } }) => {
      if (!state.mixMatchSelections[childComboId]) {
        state.mixMatchSelections[childComboId] = { childComboId, selections: [] };
      }
      state.mixMatchSelections[childComboId].selections.push(item);
    },
    removeMixMatchItem: (state, { payload: { childComboId, index } }) => {
      if (state.mixMatchSelections[childComboId]) {
        state.mixMatchSelections[childComboId].selections.splice(index, 1);
      }
    },
    clearMixMatch: (state, { payload: childComboId }) => {
      delete state.mixMatchSelections[childComboId];
    },
  },
});

export const {
  setLoading, setRootCombos, setCurrentCombo, setError,
  addMixMatchItem, removeMixMatchItem, clearMixMatch,
} = comboSlice.actions;

export default comboSlice.reducer;
