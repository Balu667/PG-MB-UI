declare module "expo-constants" {
  interface Extra {
    apiUrl: string;
    fileUrl: string;
  }

  interface AppOwnership {
    extra: Extra;
  }
}
