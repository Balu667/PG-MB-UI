// app/protected/_layout.tsx
import React from "react";
import { Slot, usePathname, useRouter } from "expo-router";
import AppHeader from "@/src/components/AppHeader";
import { PropertyProvider } from "@/src/context/PropertyContext";

export default function ProtectedLayout() {
  const pathname = usePathname();
  const router = useRouter();

  const HEADERLESS = new Set(["/protected/AddandEditProperty"]);

  const isPropertyDetail = pathname.startsWith("/protected/property/");
  const isExpenseScreen = pathname.startsWith("/protected/expenses/");
  const isEmployeeScreen = pathname.startsWith("/protected/employees/"); // ✅ NEW

  const hideHeader = [...HEADERLESS].some((p) => pathname.startsWith(p));

  const expensePropertyId = isExpenseScreen ? pathname.split("/")[3] : null;
  const employeePropertyId = isEmployeeScreen ? pathname.split("/")[3] : null; // ✅ NEW

  const handleBack = () => {
    if (isExpenseScreen && expensePropertyId) {
      router.replace({
        pathname: `/protected/property/${expensePropertyId}`,
        params: { tab: "Expenses" },
      });
    } else if (isEmployeeScreen && employeePropertyId) {
      router.replace({
        pathname: `/protected/property/${employeePropertyId}`,
        params: { tab: "Staff" },
      });
    } else {
      router.push("/protected/(tabs)/Properties");
    }
  };

  return (
    <PropertyProvider>
      {!hideHeader && (
        <AppHeader
          showBack={isPropertyDetail || isExpenseScreen || isEmployeeScreen}
          onBackPress={handleBack}
        />
      )}
      <Slot />
    </PropertyProvider>
  );
}
