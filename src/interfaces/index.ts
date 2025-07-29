export interface JwtPayload {
  _id: string;
  phoneNumber: string;
  phoneNumberCode: string;
  createdAt: string;
  preferredLaunguage: string;
  role: number;
  status: number;
  updatedAt: string;
  email: string;
  fullName: string;
  iat: number; // issued at (Unix timestamp)
  exp: number; // expiry time (Unix timestamp)
}

export * from "./property";
