import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { fetchData } from "@/helper";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig?.extra?.API_URL;

interface PropertyDetails {
  id: string;
  layoutName: string;
  // Add other fields as needed
}

interface PropertyResponse {
  data: PropertyDetails;
  message?: string;
}

interface BookingPayload {
  userId: string;
  propertyId: string;
  // Add booking form fields
}

interface BookingResponse {
  message: string;
  bookingId?: string;
  // Add other fields if returned
}

const useGetPropertyDetails = (id: string | undefined) => {
  const query = useQuery<PropertyDetails, Error>({
    queryKey: ["propertyLayoutDetails", id],
    queryFn: async () => {
      const res: PropertyResponse = await fetchData({
        url: `${API_URL}propertyLayout/${id}`,
      });
      return res.data;
    },
    enabled: !!id,
    refetchOnMount: "always",
  });

  if (query.error) {
    Toast.show({
      type: "error",
      text1: "Fetch Error",
      text2: query.error.message.split(":")[1] ?? "Unknown error",
    });
  }

  return query;
};

const useInsertBooking = (
  onSuccessFunctions: (data: BookingResponse) => void
) => {
  const queryClient = useQueryClient();

  return useMutation<BookingResponse, Error, BookingPayload>({
    mutationFn: (data: BookingPayload) =>
      fetchData({
        url: `${API_URL}properties`,
        method: "POST",
        body: data,
      }),
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Booking Failed",
        text2: error.message,
      });
    },
    onSuccess: (data: BookingResponse) => {
      Toast.show({
        type: "success",
        text1: "Booking Successful",
        text2: data.message,
      });
      onSuccessFunctions(data);
      queryClient.invalidateQueries({ queryKey: ["propertyList"] });
    },
  });
};

export { useGetPropertyDetails, useInsertBooking };
