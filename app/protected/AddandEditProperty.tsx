// app/protected/AddandEditProperty.tsx
// Legacy redirect - redirects to the new property edit screen
import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function AddandEditPropertyRedirect() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();

  useEffect(() => {
    // Redirect to the new [id].tsx route
    const targetId = params.id || "new";
    router.replace({
      pathname: "/protected/property/edit/[id]",
      params: { id: targetId },
    });
  }, [params.id, router]);

  return null;
}
