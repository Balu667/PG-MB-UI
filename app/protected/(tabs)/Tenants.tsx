// app/protected/(tabs)/Tenants.tsx
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { useProperty } from "@/src/context/PropertyContext";

export default function RedirectTenants() {
  const router = useRouter();
  const { selectedId, loading, properties } = useProperty();
  const navigated = useRef(false);

  useEffect(() => {
    if (navigated.current) return; // prevent duplicate replace()
    if (loading) return; // wait for context data

    if (selectedId) {
      navigated.current = true;
      router.replace({
        pathname: `/protected/property/${selectedId}`,
        params: { tab: "Tenants" },
      });
    } else {
      // No properties available -> send user to list
      navigated.current = true;
      router.replace("/protected/(tabs)/Properties");
    }
  }, [selectedId, loading, router, properties?.length]);

  return null;
}
