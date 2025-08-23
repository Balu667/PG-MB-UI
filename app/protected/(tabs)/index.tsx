import { Redirect } from "expo-router";

export default function Index() {
  // Redirect to the protected tabs as the default page
  return <Redirect href="/protected/(tabs)/Properties" />;
}
