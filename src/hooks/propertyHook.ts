import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { fetchData } from "@/helper";

interface ProfileData {
  userId: string;
  role: number;
}

interface PropertyData {
  _id: string;
  filePath?: string;
}

interface FetchResponse {
  message: string;
  data?: any;
}

const useGetPropertyList = (profileData: ProfileData) => {
  const { userId: id, role } = profileData;
  const url =
    role === 1 ? `properties/owner/${id}` : `employees/properties/${id}`;

  return useQuery({
    queryKey: ["propertyList", id],
    queryFn: () => fetchData({ url }),
    enabled: !!id,
    refetchOnMount: "always",
  });
};

const useGetPropertyData = (id: string) => {
  const url = `properties/${id}`;

  return useQuery({
    queryKey: ["property", id],
    queryFn: () => fetchData({ url }),
    enabled: !!id,
    refetchOnMount: "always",
  });
};

const useGetPropertyDetailsList = (profileData: any) => {
  const id = profileData?.userId;
  const url =
    profileData?.role === 1
      ? `propertiesDetails/${id}`
      : `employees/propertiesDetails/${id}`;

  return useQuery({
    queryKey: ["propertyDetailsList", id],
    queryFn: async () => {
      const response = await fetchData({ url });
      console.log("Property Details Response:", response);
      return response?.data;
    },
    enabled: !!id,
  });
};

const useInsertProperty = (
  onSuccessFunctions: (data: FetchResponse) => void,
  id: string
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) =>
      fetchData({ url: "properties", method: "POST", body: data }),
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
    onSuccess: (data: FetchResponse) => {
      Alert.alert("Success", data.message);
      onSuccessFunctions(data);
      queryClient.invalidateQueries({ queryKey: ["propertyList", id] });
      queryClient.invalidateQueries({ queryKey: ["propertyDetailsList", id] });
    },
  });
};

const useUpdateProperty = (
  onSuccessFunctions: (data: FetchResponse) => void,
  id: string
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      formData,
      propertyId,
    }: {
      formData: FormData;
      propertyId: string;
    }) =>
      fetchData({
        url: `properties/${propertyId}`,
        method: "PUT",
        body: formData,
      }),
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
    onSuccess: (data: FetchResponse) => {
      Alert.alert("Success", data.message);
      onSuccessFunctions(data);
      queryClient.invalidateQueries({ queryKey: ["propertyDetailsList"] });
      queryClient.invalidateQueries({ queryKey: ["propertyList", id] });
    },
  });
};

const useDeletePropertyImage = (
  onSuccessFunctions: (data: FetchResponse) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      payload,
      propertyId,
    }: {
      payload: any;
      propertyId: string;
    }) =>
      fetchData({
        url: `properties/${propertyId}/images`,
        method: "DELETE",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      }),
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
    onSuccess: (data: FetchResponse) => {
      Alert.alert("Success", data.message);
      onSuccessFunctions(data);
      queryClient.invalidateQueries({ queryKey: ["propertyDetailsList"] });
    },
  });
};

const useGetPropertyMertics = (onSuccessFunctions: (data: any) => void) => {
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetchData({
        url: "dashboard/metrics",
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      return response.data;
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
    onSuccess: (data: any) => {
      onSuccessFunctions(data);
    },
  });
};

const useGetStateCityList = (onSuccessFunctions: (data: any) => void) => {
  return useMutation({
    mutationFn: (stateCode: string) =>
      fetchData({ url: `cities/${stateCode}`, method: "GET" }),
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
    onSuccess: (data: any) => {
      onSuccessFunctions(data);
    },
  });
};

export {
  useInsertProperty,
  useGetPropertyList,
  useUpdateProperty,
  useDeletePropertyImage,
  useGetPropertyDetailsList,
  useGetPropertyMertics,
  useGetStateCityList,
  useGetPropertyData,
};
