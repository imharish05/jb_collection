// Admin/src/redux/slices/newComboSlice.js
import { createSlice } from "@reduxjs/toolkit";

const newComboSlice = createSlice({
  name: "newCombos",
  initialState: {
    rootCombos:  [],
    currentRoot: null,
    loading:     false,
    error:       null,
  },
  reducers: {
    setLoading:      (state)               => { state.loading = true;  state.error = null; },
    setRootCombos:   (state, { payload })  => { state.loading = false; state.rootCombos = payload; },
    setCurrentRoot:  (state, { payload })  => { state.loading = false; state.currentRoot = payload; },
    setError:        (state, { payload })  => { state.loading = false; state.error = payload; },

    // Optimistic helpers
    addRootCombo:    (state, { payload })  => { state.rootCombos.unshift(payload); },
    updateRootCombo: (state, { payload })  => {
      const idx = state.rootCombos.findIndex(r => r.id === payload.id);
      if (idx !== -1) state.rootCombos[idx] = payload;
    },
    removeRootCombo: (state, { payload })  => {
      state.rootCombos = state.rootCombos.filter(r => r.id !== payload);
      if (state.currentRoot?.id === payload) state.currentRoot = null;
    },

    // Update current root's children list after child mutation
    addChildToRoot: (state, { payload: child }) => {
      if (state.currentRoot && state.currentRoot.id === child.rootComboId) {
        if (!state.currentRoot.children) state.currentRoot.children = [];
        state.currentRoot.children.push({ ...child, comboProducts: [] });
      }
    },
    updateChildInRoot: (state, { payload: child }) => {
      if (state.currentRoot?.children) {
        const idx = state.currentRoot.children.findIndex(c => c.id === child.id);
        if (idx !== -1) {
          state.currentRoot.children[idx] = {
            ...state.currentRoot.children[idx],
            ...child,
          };
        }
      }
    },
    removeChildFromRoot: (state, { payload: childId }) => {
      if (state.currentRoot?.children) {
        state.currentRoot.children = state.currentRoot.children.filter(c => c.id !== childId);
      }
    },
    addProductToChild: (state, { payload: { childId, product } }) => {
      if (state.currentRoot?.children) {
        const child = state.currentRoot.children.find(c => c.id === childId);
        if (child) {
          if (!child.comboProducts) child.comboProducts = [];
          child.comboProducts.push(product);
        }
      }
    },
    removeProductFromChild: (state, { payload: { childId, productRecordId } }) => {
      if (state.currentRoot?.children) {
        const child = state.currentRoot.children.find(c => c.id === childId);
        if (child?.comboProducts) {
          child.comboProducts = child.comboProducts.filter(p => p.id !== productRecordId);
        }
      }
    },
  },
});

export const {
  setLoading, setRootCombos, setCurrentRoot, setError,
  addRootCombo, updateRootCombo, removeRootCombo,
  addChildToRoot, updateChildInRoot, removeChildFromRoot,
  addProductToChild, removeProductFromChild,
} = newComboSlice.actions;

export default newComboSlice.reducer;
