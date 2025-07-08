import { Slot, router } from "expo-router";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import { RootState } from "@/src/redux/store"; // adjust path as needed

export default function ProtectedLayout() {
  const {profileData} = useSelector((state: RootState) => state.profileDetails);
if(profileData?.isSignedIn){
  router.replace("../login");
}
  return <Slot />;
}
