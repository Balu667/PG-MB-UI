// app/protected/_layout.tsx
import React from "react";
import { Slot, usePathname } from "expo-router";
import AppHeader from "@/src/components/AppHeader";
import { PropertyProvider } from "@/src/context/PropertyContext";

const HEADERLESS = new Set<string>(["/protected/AddandEditProperty"]);

export default function ProtectedLayout() {
  const pathname = usePathname();
  const hideHeader = [...HEADERLESS].some((p) => pathname.startsWith(p));

  return (
    <PropertyProvider>
      {!hideHeader && <AppHeader />}
      <Slot />
    </PropertyProvider>
  );
}
