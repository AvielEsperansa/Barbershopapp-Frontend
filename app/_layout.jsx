import { Stack } from "expo-router";
import { useEffect } from "react";
import { AppState } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import notificationManager from "../lib/notificationManager";
import tokenManager from "../lib/tokenManager";

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

    // מתחיל את מערכת ההודעות
    const initNotifications = async () => {
      try {
        // רושם למכשיר לקבלת הודעות
        await notificationManager.registerForPushNotificationsAsync();

        // מוסיף מאזין ללחיצה על הודעות
        const responseListener = notificationManager.addNotificationResponseListener(response => {
          const data = response.notification.request.content.data;
          console.log('Notification tapped:', data);

          // כאן אפשר להוסיף ניווט לפי סוג ההודעה
          if (data.type === 'appointment_reminder') {
            // ניווט לעמוד התורים
          } else if (data.type === 'new_appointment') {
            // ניווט לעמוד התורים של הספר
          }
        });

        return () => {
          notificationManager.removeNotificationSubscription(responseListener);
        };
      } catch (error) {
        console.log('Failed to initialize notifications:', error);
      }
    };

    initTokenManager();
    initNotifications();

    // מטפל במצב שבו האפליקציה חוזרת לרקע
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        // האפליקציה חזרה לרקע - מרענן טוקן ברקע בלי להפריע למשתמש
        // לא מחכים לתוצאה כדי לא להפריע למשתמש
        tokenManager.refreshTokenOnAppResume().catch(error => {
          console.log('Background token refresh failed:', error.message);
          // אם יש בעיה, לא מפריעים למשתמש - הוא יגלה את זה בפעם הבאה שיעשה פעולה
        });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(customerTabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(barberTabs)" options={{ headerShown: false }} />

        <Stack.Screen name="editProfile" options={{ headerShown: false }} />
        <Stack.Screen name="myAppointments" options={{ headerShown: false }} />
        <Stack.Screen name="security" options={{ headerShown: false }} />
        <Stack.Screen name="help" options={{ headerShown: false }} />
        <Stack.Screen name="haircutHistory" options={{ headerShown: false }} />
        <Stack.Screen name="notificationSettings" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  )
}