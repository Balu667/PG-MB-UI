import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { fetchData } from "@/helper";

const BASE_URL = `tenants/`;

// 🔹 Fetch all tenants for a property
const useGetAllTenants = (id: string, queryParams: string) => {
  return useQuery({
    queryKey: ["tenantsList", id, queryParams],
    queryFn: async () => {
      const response = await fetchData({
        url: `${BASE_URL}properties/${id}${queryParams}`,
        method: "GET",
      });
      return response.data;
    },
    enabled: !!id,
    refetchOnMount: "always",
  });
};

// 🔹 Insert tenant
const useInsertTenant = (onSuccessFunctions: (data: any) => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) =>
      fetchData({
        url: BASE_URL,
        method: "POST",
        body: data,
      }),
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
    onSuccess: (data: any) => {
      onSuccessFunctions(data);
      queryClient.invalidateQueries({ queryKey: ["tenantsList"] });
      queryClient.invalidateQueries({ queryKey: ["roomsList"] });
      queryClient.invalidateQueries({ queryKey: ["propertyLayoutDetails"] });
    },
  });
};

// 🔹 Update tenant
const useUpdateTenant = (onSuccessFunctions: (data: any) => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ formData, tenantId }: { formData: FormData; tenantId: string }) =>
      fetchData({
        url: `${BASE_URL}${tenantId}`,
        method: "PATCH",
        body: formData,
      }),
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
    onSuccess: (data: any) => {
      onSuccessFunctions(data);
      queryClient.invalidateQueries({ queryKey: ["tenantsList"] });
      queryClient.invalidateQueries({ queryKey: ["tenantdetails"] });
      queryClient.invalidateQueries({ queryKey: ["propertyDetailsList"] });
    },
  });
};

// 🔹 Delete tenant files
const useDeleteTenantFiles = (deleteFileSuccessFn: (data: any) => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, tenantId }: { payload: any; tenantId: string }) =>
      fetchData({
        url: `${BASE_URL}${tenantId}/images`,
        method: "DELETE",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      }),
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
    onSuccess: (data: any) => {
      Alert.alert("Success", data.message);
      deleteFileSuccessFn(data);
      queryClient.invalidateQueries({ queryKey: ["tenantsList"] });
      queryClient.invalidateQueries({ queryKey: ["tenantdetails"] });
    },
  });
};

// 🔹 Get tenant details by ID (admin)
const useGetAllTenantDetails = (id: string) => {
  return useQuery({
    queryKey: ["tenantdetails", id],
    queryFn: async () => {
      const response = await fetchData({
        url: `${BASE_URL}${id}`,
        method: "GET",
      });
      return response.data;
    },
    enabled: !!id,
    refetchOnMount: "always",
  });
};

// 🔹 Send EKYC request
const useSendEKYC = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { tenantId: string }) =>
      fetchData({
        url: `${BASE_URL}ekyc/${data.tenantId}`,
        method: "POST",
      }),
    onSuccess: (data: any) => {
      Alert.alert("Success", data.message);
      queryClient.invalidateQueries({ queryKey: ["tenantdetails", id] });
    },
    onError: (error: Error) => {
      Alert.alert("Error", "Error sending eKYC: " + error.message);
    },
  });
};

// 🔹 Notify tenant
const useNotifyTenant = () => {
  return useMutation({
    mutationFn: (data: any) =>
      fetchData({
        url: `${BASE_URL}notify`,
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: (data: any) => {
      Alert.alert("Success", data.message);
    },
    onError: (error: Error) => {
      Alert.alert("Error", "Error notifying tenant: " + error.message);
    },
  });
};

// 🔹 Update tenant details (self-update by tenant)
const useUpdateTenantByTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ formData, tenantId }: { formData: FormData; tenantId: string }) =>
      fetchData({
        url: `${BASE_URL}ekyc/${tenantId}`,
        method: "PATCH",
        body: formData,
      }),
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenantsList"] });
      queryClient.invalidateQueries({ queryKey: ["tenantdetails"] });
      queryClient.invalidateQueries({ queryKey: ["propertyDetailsList"] });
      Alert.alert("Success", "Tenant details updated successfully");
    },
  });
};

// 🔹 Get tenant details by tenant (self-view)
const useGetTenantDetailsByTenant = (id: string) => {
  return useQuery({
    queryKey: ["tenantdetails", id],
    queryFn: async () => {
      const response = await fetchData({
        url: `${BASE_URL}ekyc/${id}`,
        method: "GET",
      });
      return response.data;
    },
    enabled: !!id,
    refetchOnMount: "always",
  });
};

export {
  useGetAllTenants,
  useInsertTenant,
  useUpdateTenant,
  useDeleteTenantFiles,
  useGetAllTenantDetails,
  useSendEKYC,
  useNotifyTenant,
  useUpdateTenantByTenant,
  useGetTenantDetailsByTenant,
};
