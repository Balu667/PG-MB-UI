import { combineReducers } from '@reduxjs/toolkit';

import propertyReducer from './propertySlice';
import profileReducer from './profileSlice';
import filterReducer from './filterSlice';
import sidebarReducer from './sideBarSlice';
import timerReducer from './timerSlice';

const rootReducer = combineReducers({
  propertyDetails: propertyReducer,
  profileDetails: profileReducer,
  filterDetails: filterReducer,
  sidebar: sidebarReducer,
  timerDetails: timerReducer,
});

export default rootReducer;
