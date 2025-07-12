import { RootState } from "@/src/redux/store"; // adjust path as needed
import { Slot, router } from "expo-router";
import { useEffect } from "react";
import { useSelector } from "react-redux";

export default function ProtectedLayout() {
  const {profileData} = useSelector((state: RootState) => state.profileDetails);

useEffect(() => {
    if (!profileData?.signedIn) {
      router.replace("/public"); 
    }
  }, [profileData?.signedIn]);
  return <Slot />;
}
