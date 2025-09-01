import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { AppState } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import tokenManager from "../lib/tokenManager";
import SafeScreen from "./components/SafeScreen";

export default function RootLayout() {
  useEffect(() => {
    // מתחיל את מערכת הרענון האוטומטי של הטוקנים כשהאפליקציה נפתחת
    const initTokenManager = async () => {
      try {
        // מרענן טוקן מיד ומתחיל רענון אוטומטי
        await tokenManager.refreshTokenOnAppStart();
      } catch (error) {
        console.log('Failed to initialize token manager:', error);
      }
    };

    initTokenManager();

    // מטפל במצב שבו האפליקציה חוזרת לרקע
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        // האפליקציה חזרה לרקע - מרענן טוקן
        tokenManager.refreshTokenOnAppResume();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);

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
          <Stack.Screen name="help" options={{ headerShown: false }} />
          <Stack.Screen name="barberProfile" options={{ headerShown: false }} />
          <Stack.Screen name="haircutHistory" options={{ headerShown: false }} />
        </Stack>
      </SafeScreen>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  )
}
