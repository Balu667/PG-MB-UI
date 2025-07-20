import { useRouter } from "expo-router";
import { useEffect } from "react";
// import { pgProperties } from "@/src/constants/mockData"; // same dummy list
import { pgProperties } from "@/src/constants/mockData";

export default function RedirectRooms() {
  const router = useRouter();
  useEffect(() => {
    const firstId = pgProperties[0]._id; // later: use selectedId in redux
    router.replace({
      pathname: `/protected/property/${firstId}`,
      params: { tab: "Tenants" }, // or "Tenants"
    });
  }, []);
  return null;
}
