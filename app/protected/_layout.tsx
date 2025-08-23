// import React from "react";
// import { Slot, useSegments } from "expo-router";
// import { PropertyProvider } from "@/src/context/PropertyContext";
// import AppHeader from "@/src/components/AppHeader";

// export default function ProtectedLayout() {
//   /* ----------------------------------------------------------
//    * If the current route is inside /property/... or /tenant/...
//    * showBack = true so the header displays the chevron.
//    * -------------------------------------------------------- */
//   const segments = useSegments();
//   const last = segments[segments.length - 1];
//   const detail = last === "property" || last === "tenant";

//   return (
//     <PropertyProvider>
//       {/* header is always visible */}
//       <AppHeader
//         showBack={detail}
//         onBackPress={() => history.back()}
//         onNotificationPress={() => {
//           /* later: navigate to notifications */
//         }}
//       />

//       {/* nested routes render here */}
//       <Slot />
//     </PropertyProvider>
//   );
// }
// --- inside app/protected/_layout.tsx ----------------------------
import { Slot, useSegments, useRouter } from "expo-router";
import AppHeader from "@/src/components/AppHeader";
import { PropertyProvider } from "@/src/context/PropertyContext";

export default function ProtectedLayout() {
  const segments = useSegments(); // ["protected","property","[id]"] …
  const router = useRouter();

  const isTabScreen = segments.includes("(tabs)");

  /** Arrow behaviour – pop if possible, else return to tabs root */
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/protected/(tabs)");
    }
  };

  return (
    <PropertyProvider>
      <AppHeader showBack={!isTabScreen} onBackPress={handleBack} onNotificationPress={() => {}} />
      <Slot /> {/* renders the current route */}
    </PropertyProvider>
  );
}
