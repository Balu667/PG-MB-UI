import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { fetchData } from "@/helper";

interface FetchResponse {
  message: string;
  data?: any;
}

export const useGetPgOwner = (id: string) => {
  const url = `pgOwner/${id}`;

  return useQuery<FetchResponse>({
    queryKey: ["pgOwner", id],
    queryFn: async () => {
      const response = await fetchData({ url });
      return response;
    },
    enabled: !!id,
    refetchOnMount: "always",
  });
};

export const useUpdateOwner = ({
  ownerId,
  onSuccessFn,
}: {
  ownerId: string;
  onSuccessFn: () => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation<FetchResponse, Error, { data: any }>({
    mutationFn: ({ data }) =>
      fetchData({
        url: `pgOwner/${ownerId}`,
        method: "PATCH",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pgOwner", ownerId] });
      Alert.alert("Success", data.message || "PG Owner updated successfully");
      onSuccessFn();
    },
    onError: (error: Error) => {
      Alert.alert("Error", `Error updating PG Owner: ${error.message}`);
    },
  });
};
