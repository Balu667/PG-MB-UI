// src/context/PropertyContext.tsx
import React, { createContext, useContext, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import { useGetPropertyDetailsList } from "@/src/hooks/propertyHook";
import { RootState } from "@/src/redux/store"; // adjust the path if needed
import { setPropertyDetails } from "@/src/redux/slices/propertySlice";

export interface PropertyCtx {
  properties: { _id: string; propertyName: string }[];
  selectedId: string | undefined;
  setSelected: (id: string) => void;
  loading: boolean;
}

const Ctx = createContext<PropertyCtx | undefined>(undefined);
export const useProperty = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProperty must be inside <PropertyProvider>");
  return ctx;
};

export const PropertyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const { profileData } = useSelector((s: RootState) => s.profileDetails);

  // fetch list (react-query caches it)
  const { data = [], isLoading } = useGetPropertyDetailsList(profileData);

  // selected property id lives in Redux (so other slices can react to it)
  const selectedId = useSelector((s: RootState) => s?.propertyDetails?.propertyData?._id);

  const setSelected = useCallback(
    (id: string) => dispatch(setPropertyDetails({ _id: id })), // you can store more if you need
    [dispatch]
  );

  // once the list arrives, make sure we have a default selected id
  React.useEffect(() => {
    if (!selectedId && data.length) setSelected(data[0]._id);
  }, [data, selectedId, setSelected]);

  const value = useMemo(
    () => ({
      properties: data.map(({ _id, propertyName }: any) => ({ _id, propertyName })),
      selectedId,
      setSelected,
      loading: isLoading,
    }),
    [data, selectedId, isLoading, setSelected]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
