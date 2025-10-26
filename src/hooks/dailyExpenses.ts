// src/hooks/dailyExpenses.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { fetchData } from "@/helper";

interface FetchResponse {
  message: string;
  data?: any;
}

const useGetDailyExpensesList = (id: string) => {
  return useQuery({
    queryKey: ["expensesList", id],
    queryFn: async () => {
      let response = await fetchData({ url: `expenses/property/${id}` });
      return response?.data;
    },
    enabled: !!id,
  });
};

const useInsertDailyExpenses = (onSuccessFunctions: (data: FetchResponse) => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) =>
      fetchData({
        url: "expenses",
        method: "POST",
        body: data,
      }),
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
    onSuccess: (data: FetchResponse) => {
      Alert.alert("Success", data.message);
      onSuccessFunctions(data);
      queryClient.invalidateQueries({ queryKey: ["expensesList"] });
    },
  });
};

const useUpdateDailyExpenses = (onSuccessFunctions: (data: FetchResponse) => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ formData, expenseId }: { formData: FormData; expenseId: string }) =>
      fetchData({
        url: `expenses/${expenseId}`,
        method: "PUT",
        body: formData,
      }),
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
    onSuccess: (data: FetchResponse) => {
      Alert.alert("Success", data.message);
      onSuccessFunctions(data);
      queryClient.invalidateQueries({ queryKey: ["expensesList"] });
    },
  });
};

const useDeleteDailyExpensesImage = (onSuccessFunctions: (data: FetchResponse) => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, expenseId }: { payload: any; expenseId: string }) =>
      fetchData({
        url: `expenses/${expenseId}/images`,
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
      queryClient.invalidateQueries({ queryKey: ["expensesList"] });
    },
  });
};

export {
  useGetDailyExpensesList,
  useInsertDailyExpenses,
  useUpdateDailyExpenses,
  useDeleteDailyExpensesImage,
};
