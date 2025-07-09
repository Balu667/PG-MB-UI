declare module 'react-native-config' {
  interface NativeConfig {
    API_URL: string;
    FEATURE_FLAG: string;
    FILE_URL: string;
  }
  const Config: NativeConfig;
  export default Config;
}
