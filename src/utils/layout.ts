// src/utils/layout.ts
import { Dimensions } from "react-native";

const { width } = Dimensions.get("window");
export const scale = (n: number) => Math.round((width / 375) * n);

export const clamp = (min: number, value: number, max: number) =>
  Math.max(min, Math.min(value, max));
