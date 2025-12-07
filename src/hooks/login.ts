import { useMutation } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { fetchData } from "@/helper";

// Interfaces (simplified — expand as needed)
interface LoginPayload {
  phoneNumber: string;
}

interface LoginResponse {
  message: string;
  data: { token: string; name: string; _id?: string; userId?: string }; // Flexible shape for API response
}

interface OtpPayload {
  _id: string;
  otp: string;
  role: number;
}

interface OtpResponse {
  message: string;
  data: any; // Update with actual shape
}

const useGetLogin = (
  onSuccessFunctions: (data: LoginResponse["data"]) => void
) => {
  return useMutation<LoginResponse, Error, LoginPayload>({
    mutationFn: (data) => {
      return fetchData<LoginResponse>({
        url: `pgowner/login`,
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2: error.message,
      });
    },
    onSuccess: (data) => {
      Toast.show({
        type: "success",
        text1: "Login Successful",
        text2: data.message,
      });
      onSuccessFunctions(data.data);
    },
  });
};

const useVerifyOtp = (
  onSuccessFunctions: (data: OtpResponse["data"]) => void,
  options?: { onError?: (error: Error) => void }
) => {
  return useMutation<OtpResponse, Error, OtpPayload>({
    mutationFn: (data) =>
      fetchData<OtpResponse>({
        url: `pgowner/verifyOtp`,
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    onError: (error) => {
      if (options?.onError) {
        options.onError(error);
      } else {
        Toast.show({
          type: "error",
          text1: "OTP Verification Failed",
          text2: error.message,
        });
      }
    },
    onSuccess: (data) => {
      Toast.show({
        type: "success",
        text1: "OTP Verified",
        text2: data?.message || "Logging you in...",
      });
      onSuccessFunctions(data.data);
    },
  });
};

const useResendOtp = (
  onSuccessFunctions: (data: OtpResponse["data"]) => void
) => {
  return useMutation<OtpResponse, Error, { phoneNumber: string; id?: string }>({
    mutationFn: (data) =>
      fetchData<OtpResponse>({
        url: `pgowner/resendOtp`,
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Resend OTP Failed",
        text2: error.message,
      });
    },
    onSuccess: (data) => {
      onSuccessFunctions(data.data);
    },
  });
};

export { useGetLogin, useVerifyOtp, useResendOtp };
