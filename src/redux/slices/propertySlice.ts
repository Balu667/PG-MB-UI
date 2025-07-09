import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PropertyState {
  propertyData: Record<string, any> | null; // You can define a custom type here if needed
}

const initialState: PropertyState = {
  propertyData: null,
};

const propertySlice = createSlice({
  name: 'property',
  initialState,
  reducers: {
    setPropertyDetails: (state, action: PayloadAction<Record<string, any>>) => {
      state.propertyData = action.payload;
    },
  },
});

export const { setPropertyDetails } = propertySlice.actions;
export default propertySlice.reducer;
