// app/protected/_layout.tsx
import React from "react";
import { Slot, usePathname, useRouter } from "expo-router";
import AppHeader from "@/src/components/AppHeader";
import { PropertyProvider } from "@/src/context/PropertyContext";

export default function ProtectedLayout() {
  const pathname = usePathname();
  const router = useRouter();

  // Screens that should NOT show AppHeader (we handle header ourselves)
  const HEADERLESS = new Set([
    "/protected/AddandEditProperty",
    "/protected/rooms", // hide header for Add/Edit Room screen
    "/protected/advancedBooking",
    "/protected/tenant", // hide header for Add/Edit Tenant screen
    "/protected/employees", // hide header for Add/Edit Employee screen
    "/protected/expenses", // hide header for Add/Edit Expense screen
    "/protected/dues", // hide header for Pay/Edit Due screen
  ]);

  const isPropertyDetail = pathname.startsWith("/protected/property/");

  const hideHeader = [...HEADERLESS].some((p) => pathname.startsWith(p));

  const handleBack = () => {
    router.push("/protected/(tabs)/Properties");
  };

  return (
    <PropertyProvider>
      {!hideHeader && (
        <AppHeader
          showBack={isPropertyDetail}
          onBackPress={handleBack}
        />
      )}
      <Slot />
    </PropertyProvider>
  );
}
