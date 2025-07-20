import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ProfileState {
  profileData: Record<string, any> | null;
}

const initialState: ProfileState = {
  profileData: {
    signedIn: false,
  },
};

const profileSlice = createSlice({
  name: "ProfileDetails",
  initialState,
  reducers: {
    setProfileDetails: (state, action: PayloadAction<Record<string, any>>) => {
      state.profileData = action.payload;
    },
  },
});

export const { setProfileDetails } = profileSlice.actions;
export default profileSlice.reducer;
