import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { fetchData } from "@/helper";

interface FetchResponse {
  message: string;
  data?: any;
}

const useGetPropertyDetails = (id: string) => {
  const url = `propertyLayout/${id}`;

  return useQuery({
    queryKey: ["propertyLayoutDetails", id],
    queryFn: async () => fetchData({ url }),
    enabled: !!id,
    refetchOnMount: "always",
  });
};

const useInsertBooking = (onSuccessFunctions: (data: FetchResponse) => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData | any) =>
      fetchData({
        url: "properties",
        method: "POST",
        body: data,
      }),
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
    onSuccess: (data: FetchResponse) => {
      Alert.alert("Success", data.message);
      onSuccessFunctions(data);
      queryClient.invalidateQueries({ queryKey: ["propertyList"] });
    },
  });
};

export { useGetPropertyDetails, useInsertBooking };
