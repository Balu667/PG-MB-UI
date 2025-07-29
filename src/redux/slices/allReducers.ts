import { combineReducers } from "@reduxjs/toolkit";

import propertyReducer from "./propertySlice";
import profileReducer from "./profileSlice";
import filterReducer from "./filterSlice";
import sidebarReducer from "./sideBarSlice";
import timerReducer from "./timerSlice";

const appReducer = combineReducers({
  propertyDetails: propertyReducer,
  profileDetails: profileReducer,
  filterDetails: filterReducer,
  sidebar: sidebarReducer,
  timerDetails: timerReducer,
});

// Root reducer with LOGOUT action handling
const rootReducer = (
  state: ReturnType<typeof appReducer> | undefined,
  action: any
) => {
  if (action.type === "LOGOUT") {
    state = undefined; // resets all slices to initial state
  }
  return appReducer(state, action);
};

export default rootReducer;
