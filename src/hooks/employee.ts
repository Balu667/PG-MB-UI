// src/hooks/employees.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { fetchData } from "@/helper";

interface FetchResponse {
  message?: string;
  data?: any;
}

// ─────────────────────────────────────────────
// GET EMPLOYEES LIST
// ─────────────────────────────────────────────
const useGetAllEmployees = (ownerId: string) => {
  return useQuery({
    queryKey: ["employeeList", ownerId],
    queryFn: async () => {
      const response = await fetchData({
        url: `employees/owner/${ownerId}`,
        method: "GET",
      });
      return response?.data;
    },
    enabled: !!ownerId,
  });
};

// ─────────────────────────────────────────────
// INSERT EMPLOYEE
// ─────────────────────────────────────────────
const useInsertEmployee = (onSuccessFunctions: (data: FetchResponse) => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) =>
      fetchData({
        url: `employees`,
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
      Alert.alert("Success", data?.message || "Employee added");
      queryClient.invalidateQueries({ queryKey: ["employeeList"] });
    },
  });
};

// ─────────────────────────────────────────────
// UPDATE EMPLOYEE
// ─────────────────────────────────────────────
const useUpdateEmployee = (onSuccessFunctions: (data: FetchResponse) => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, employeeId }: { data: any; employeeId: string }) =>
      fetchData({
        url: `employees/${employeeId}`,
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
      Alert.alert("Success", data?.message || "Employee updated");
      queryClient.invalidateQueries({ queryKey: ["employeeList"] });
    },
  });
};

export { useGetAllEmployees, useInsertEmployee, useUpdateEmployee };
