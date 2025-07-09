import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import profileReducer from "../slices/profileSlice"; // replace with actual slice(s)
// import other reducers as needed

// 🔀 Combine all slice reducers
const rootReducer = combineReducers({
  profileDetails: profileReducer,
});

// ⚙️ Redux Persist Config
const persistConfig = {
  key: "root",
  version: 1,
  storage: AsyncStorage,
  blacklist: [], // Add slice keys here to exclude from persistence
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// 🏗️ Create Redux Store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Required to suppress Redux Persist warning actions
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: __DEV__,
});

// 🗃️ Create Persistor
export const persistor = persistStore(store);

// 🧠 Typed Helpers
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
