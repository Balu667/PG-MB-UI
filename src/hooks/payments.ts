// src/hooks/payments.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { fetchData } from "@/helper";

interface FetchResponse {
  message?: string;
  data?: any;
}

// ─────────────────────────────────────────────
// GET ALL PAYMENTS (single payment group)
// ─────────────────────────────────────────────
const useGetAllPayment = (id: string) => {
  return useQuery({
    queryKey: ["paymentList", id],
    queryFn: async () => {
      const response = await fetchData({
        url: `payments/${id}`,
        method: "GET",
      });
      return response?.data;
    },
    enabled: !!id,
  });
};

// ─────────────────────────────────────────────
// GET TENANT PAYMENTS
// ─────────────────────────────────────────────
const useGetAllTenantPayments = (tenantId: string) => {
  return useQuery({
    queryKey: ["tenantPaymentList", tenantId],
    queryFn: async () => {
      const response = await fetchData({
        url: `payments/tenant/${tenantId}`,
        method: "GET",
      });
      return response?.data;
    },
    enabled: !!tenantId,
  });
};

// ─────────────────────────────────────────────
// GET PROPERTY PAYMENTS
// ─────────────────────────────────────────────
const useGetAllPropertyPayments = (propertyId: string) => {
  return useQuery({
    queryKey: ["propertyPaymentList", propertyId],
    queryFn: async () => {
      const response = await fetchData({
        url: `payments/properties/${propertyId}`,
        method: "GET",
      });
      return response?.data;
    },
    enabled: !!propertyId,
    refetchOnMount: "always",
  });
};

// ─────────────────────────────────────────────
// INSERT PAYMENT
// ─────────────────────────────────────────────
const useInsertPayment = (onSuccessFunctions: (data: FetchResponse) => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) =>
      fetchData({
        url: `payments`,
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }),

    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },

    onSuccess: (data: FetchResponse) => {
      onSuccessFunctions(data);
      Alert.alert("Success", data?.message || "Payment added successfully");

      queryClient.invalidateQueries({ queryKey: ["tenantdetails"] });
      queryClient.invalidateQueries({ queryKey: ["tenantPaymentList"] });
    },
  });
};

// ─────────────────────────────────────────────
// UPDATE PAYMENT
// ─────────────────────────────────────────────
const useUpdatePayment = (onSuccessFunctions: (data: FetchResponse) => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, paymentId }: { data: any; paymentId: string }) =>
      fetchData({
        url: `payments/${paymentId}`,
        method: "PUT",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }),

    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },

    onSuccess: (data: FetchResponse) => {
      onSuccessFunctions(data);
      Alert.alert("Success", data?.message || "Payment updated");

      queryClient.invalidateQueries({ queryKey: ["tenantdetails"] });
      queryClient.invalidateQueries({ queryKey: ["tenantPaymentList"] });
      queryClient.invalidateQueries({ queryKey: ["propertyPaymentList"] });
    },
  });
};

export {
  useGetAllPayment,
  useGetAllTenantPayments,
  useGetAllPropertyPayments,
  useInsertPayment,
  useUpdatePayment,
};
