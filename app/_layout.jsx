import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SafeScreen from "./components/SafeScreen";

export default function RootLayout() {

  return (
    <SafeAreaProvider>
      <SafeScreen>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(customerTabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(barberTabs)" options={{ headerShown: false }} />
          <Stack.Screen name="editProfile" options={{ headerShown: false }} />
          <Stack.Screen name="myAppointments" options={{ headerShown: false }} />
          <Stack.Screen name="security" options={{ headerShown: false }} />
          <Stack.Screen name="haircutHistory" options={{ headerShown: false }} />
        </Stack>
      </SafeScreen>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  )
}
