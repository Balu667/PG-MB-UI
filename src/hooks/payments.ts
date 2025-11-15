import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { fetchData } from "@/helper";

// ✅ Unified response interface
interface FetchResponse {
  message: string;
  data?: any;
}

/**
 * 🧾 Get payments for a specific entity
 */
const useGetAllPayments = (id: string) => {
  return useQuery({
    queryKey: ["paymentsList", id],
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

/**
 * 🧾 Get all tenant payments
 */
const useGetAllTenantPayments = (id: string) => {
  return useQuery({
    queryKey: ["tenantPaymentList", id],
    queryFn: async () => {
      const response = await fetchData({
        url: `payments/tenant/${id}`,
        method: "GET",
      });
      return response?.data;
    },
    enabled: !!id,
  });
};

/**
 * 🧾 Get all property payments
 */
const useGetAllPropertyPayments = (id: string) => {
  return useQuery({
    queryKey: ["propertyPaymentList", id],
    queryFn: async () => {
      const response = await fetchData({
        url: `payments/properties/${id}`,
        method: "GET",
      });
      return response?.data;
    },
    enabled: !!id,
  });
};

/**
 * 💰 Insert new payment
 */
const useInsertPayment = (
  onSuccessFunctions: (data: FetchResponse) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) =>
      fetchData({
        url: `payments`,
        method: "POST",
        body: data,
      }),
    onError: (error: Error) => {
      Alert.alert(error.message || "Failed to add payment.");
    },
    onSuccess: (data: FetchResponse) => {
      Alert.alert(data.message || "Payment added successfully.");
      onSuccessFunctions(data);
      queryClient.invalidateQueries({ queryKey: ["tenantdetails"] });
      queryClient.invalidateQueries({ queryKey: ["tenantPaymentList"] });
      queryClient.invalidateQueries({ queryKey: ["propertyPaymentList"] });
    },
  });
};

/**
 * ✏️ Update existing payment
 */
const useUpdatePayment = (
  onSuccessFunctions: (data: FetchResponse) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, paymentId }: { data: FormData; paymentId: string }) =>
      fetchData({
        url: `payments/${paymentId}`,
        method: "PUT",
        body: data,
      }),
    onError: (error: Error) => {
      Alert.alert(error.message || "Failed to update payment.");
    },
    onSuccess: (data: FetchResponse) => {
      Alert.alert(data.message || "Payment updated successfully.");
      onSuccessFunctions(data);
      queryClient.invalidateQueries({ queryKey: ["tenantdetails"] });
      queryClient.invalidateQueries({ queryKey: ["tenantPaymentList"] });
      queryClient.invalidateQueries({ queryKey: ["propertyPaymentList"] });
    },
  });
};

/**

//  */
// const useDeletePayment = (
//   onSuccessFunctions: (data: FetchResponse) => void
// ) => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: (paymentId: string) =>
//       fetchData({
//         url: `payments/${paymentId}`,
//         method: "DELETE",
//       }),
//     onError: (error: Error) => {
//       Alert.alert(error.message || "Failed to delete payment.");
//     },
//     onSuccess: (data: FetchResponse) => {
//       Alert.alert(data.message || "Payment deleted successfully.");
//       onSuccessFunctions(data);
//       queryClient.invalidateQueries({ queryKey: ["paymentsList"] });
//     },
//   });
// };

export {
  useGetAllPayments,
  useInsertPayment,
  useUpdatePayment,
  useGetAllTenantPayments,
  useGetAllPropertyPayments,
};
