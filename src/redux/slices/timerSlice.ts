import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TimerState {
  endTime: string | Date | null; // supports ISO strings or Date objects
}

const initialState: TimerState = {
  endTime: null,
};

const timerSlice = createSlice({
  name: 'timer',
  initialState,
  reducers: {
    setEndTime: (state, action: PayloadAction<string | Date>) => {
      state.endTime = action.payload;
    },
    clearEndTime: (state) => {
      state.endTime = null;
    },
  },
});

export const { setEndTime, clearEndTime } = timerSlice.actions;
export default timerSlice.reducer;
