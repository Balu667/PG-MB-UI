// app/protected/(tabs)/Rooms.tsx
// Redirects to property detail screen with Rooms tab selected
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useRef } from "react";
import { useProperty } from "@/src/context/PropertyContext";

export default function RedirectRooms() {
  const router = useRouter();
  const { selectedId, loading, properties } = useProperty();
  const isNavigating = useRef(false);

  useFocusEffect(
    useCallback(() => {
      // Reset navigation flag when screen gains focus
      isNavigating.current = false;

      // Wait for property context to load
      if (loading) return;

      // Prevent duplicate navigation
      if (isNavigating.current) return;

      if (selectedId) {
        isNavigating.current = true;
        router.replace({
          pathname: `/protected/property/${selectedId}`,
          params: { tab: "Rooms" },
        });
      } else if (properties?.length === 0) {
        // No properties available -> send user to list
        isNavigating.current = true;
        router.replace("/protected/(tabs)/Properties");
      }
    }, [selectedId, loading, router, properties?.length])
  );

  return null;
}
