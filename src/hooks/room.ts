import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { Alert } from "react-native";
import { fetchData } from "@/helper";

// --- Types ---
interface Room {
  _id: string;
  name: string;
  // Add other room fields as per your API response
}

interface ApiResponse<T> {
  data: T;
  message: string;
}

interface InsertRoomPayload {
  name: string;
  // Add other fields required by your backend
}

interface UpdateRoomPayload {
  formData: any;
  roomId: string;
}

interface DeleteImagePayload {
  payload: object;
  roomId: string;
}

// --- Get All Rooms ---
const useGetAllRooms = (id: string | null) => {
  return useQuery<ApiResponse<Room[]>>({
    queryKey: ["roomsList", id],
    queryFn: async () => {
      const response = await fetchData({
        url: `rooms/properties/${id}`,
        method: "GET",
      });
      return response?.data;
    },
    enabled: !!id,
    refetchOnMount: "always",
  });
};

// --- Insert Room ---
const useInsertRoom = (onSuccessFunctions: (data: any) => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertRoomPayload) =>
      fetchData<ApiResponse<any>>({
        url: `rooms`,
        method: "POST",
        body: data,
      }),
    onError: (error: any) => {
      Toast.show({ type: "error", text1: error.message });
    },
    onSuccess: (data: any) => {
      Toast.show({ type: "success", text1: data.message });
      onSuccessFunctions(data);
      queryClient.invalidateQueries({ queryKey: ["roomsList"] });
    },
  });
};

// --- Update Room ---
const useUpdateRoom = (onSuccessFunctions: (data: any) => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ formData, roomId }: UpdateRoomPayload) =>
      fetchData<ApiResponse<any>>({
        url: `rooms/${roomId}`,
        method: "PUT",
        body: formData,
      }),
    onError: (error: any) => {
      Toast.show({ type: "error", text1: error.message });
    },
    onSuccess: (data: any) => {
      Toast.show({ type: "success", text1: data.message });
      onSuccessFunctions(data);
      queryClient.invalidateQueries({ queryKey: ["roomsList"] });
    },
  });
};

// --- Delete Room Image ---
const useDeleteRoomImage = (onSuccessFunctions: (data: any) => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, roomId }: DeleteImagePayload) =>
      fetchData<ApiResponse<any>>({
        url: `rooms/${roomId}/images`,
        method: "DELETE",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    onError: (error: any) => {
      Toast.show({ type: "error", text1: error.message });
    },
    onSuccess: (data: any) => {
      Toast.show({ type: "success", text1: data.message });
      onSuccessFunctions(data);
      queryClient.invalidateQueries({ queryKey: ["roomsList"] });
    },
  });
};

// --- Get Rooms for Short-Term Booking ---
interface ShortTermBookingParams {
  joiningDate?: string;
  moveOutDate?: string;
}

interface ShortTermRoomsResponse {
  success: boolean;
  metadata?: {
    totalShortBookings: number;
    activeShortBookings: number;
    upcomingShortBookings: number;
  };
  rooms: Room[];
}

const useGetRoomsForShortTermBooking = (
  propertyId: string | null,
  params: ShortTermBookingParams = {}
) => {
  const { joiningDate, moveOutDate } = params;

  return useQuery<ShortTermRoomsResponse>({
    queryKey: ["roomsList", propertyId, "shortTerm", joiningDate, moveOutDate],
    queryFn: async () => {
      const response = await fetchData({
        url: `rooms/properties/${propertyId}/available/short-bookings?joiningDate=${joiningDate}&moveOutDate=${moveOutDate}`,
        method: "GET",
      });
      return response ?? { rooms: [] };
    },
    enabled: Boolean(propertyId && joiningDate && moveOutDate),
    placeholderData: { success: false, rooms: [] },
  });
};

export { useGetAllRooms, useInsertRoom, useUpdateRoom, useDeleteRoomImage, useGetRoomsForShortTermBooking };
