// src/context/PropertyContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useGetPropertyDetailsList } from "@/src/hooks/propertyHook";

type Property = {
  _id: string;
  propertyName: string;
  [k: string]: any;
};

type Ctx = {
  properties: Property[];
  selectedId: string | undefined;
  setSelected: (id: string) => void;
  loading: boolean;
};

const PropertyContext = createContext<Ctx | null>(null);

export const PropertyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profileData } = useSelector((state: any) => state.profileDetails);
  const { isLoading, data: propertyData = [] } = useGetPropertyDetailsList(profileData);

  const [selectedId, setSelectedId] = useState<string | undefined>();

  // pick first property by default
  useEffect(() => {
    if (!selectedId && propertyData?.length) {
      setSelectedId(propertyData[0]._id);
    }
  }, [propertyData, selectedId]);

  const value = useMemo<Ctx>(
    () => ({
      properties: propertyData,
      selectedId,
      setSelected: setSelectedId,
      loading: isLoading,
    }),
    [propertyData, selectedId, isLoading]
  );

  return <PropertyContext.Provider value={value}>{children}</PropertyContext.Provider>;
};

export const useProperty = () => {
  const ctx = useContext(PropertyContext);
  if (!ctx) throw new Error("useProperty must be used within PropertyProvider");
  return ctx;
};
