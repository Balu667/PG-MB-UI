import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface PropertyState {
  propertyData: { _id?: string } | null; // <- at least keep the id
}
const initialState: PropertyState = {
  propertyData: null,
};

const propertySlice = createSlice({
  name: "property",
  initialState,
  reducers: {
    setPropertyDetails: (state, action: PayloadAction<Record<string, any>>) => {
      state.propertyData = action.payload;
    },
  },
});

export const { setPropertyDetails } = propertySlice.actions;
export default propertySlice.reducer;
