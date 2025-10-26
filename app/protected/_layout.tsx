// // app/protected/_layout.tsx
// import React from "react";
// import { Slot, usePathname } from "expo-router";
// import AppHeader from "@/src/components/AppHeader";
// import { PropertyProvider } from "@/src/context/PropertyContext";

// const HEADERLESS = new Set<string>(["/protected/AddandEditProperty"]);

// export default function ProtectedLayout() {
//   const pathname = usePathname();
//   const hideHeader = [...HEADERLESS].some((p) => pathname.startsWith(p));

//   return (
//     <PropertyProvider>
//       {!hideHeader && <AppHeader />}
//       <Slot />
//     </PropertyProvider>
//   );
// }
// app/protected/_layout.tsx
import React from "react";
import { Slot, usePathname, useRouter } from "expo-router";
import AppHeader from "@/src/components/AppHeader";
import { PropertyProvider } from "@/src/context/PropertyContext";

export default function ProtectedLayout() {
  const pathname = usePathname();
  const router = useRouter();

  // Screens where header should NOT appear
  const HEADERLESS = new Set(["/protected/AddandEditProperty"]);

  // Show back button only for property detail pages
  const isPropertyDetail = pathname.startsWith("/protected/property/");

  const hideHeader = [...HEADERLESS].some((p) => pathname.startsWith(p));

  return (
    <PropertyProvider>
      {!hideHeader && (
        <AppHeader
          showBack={isPropertyDetail}
          onBackPress={() => router.push("/protected/(tabs)/Properties")}
        />
      )}
      <Slot />
    </PropertyProvider>
  );
}
