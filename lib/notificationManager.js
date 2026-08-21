import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import config from '../config';
import tokenManager from './tokenManager';

// הגדרת התנהגות הודעות
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

class NotificationManager {
    constructor() {
        this.expoPushToken = null;
    }

    // רישום למכשיר לקבלת הודעות
    async registerForPushNotificationsAsync() {
        let token;

        try {
            if (Platform.OS === 'android') {
                // ערוץ מותאם אישית להתראות הספר
                await Notifications.setNotificationChannelAsync('barbershop-notifications', {
                    name: 'התראות הספר',
                    description: 'התראות על תורים ופעילויות במספרה',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#3b82f6',
                    sound: 'default',
                    enableLights: true,
                    enableVibrate: true,
                });
            }

            if (Device.isDevice) {
                const { status: existingStatus } = await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;

                if (existingStatus !== 'granted') {
                    const { status } = await Notifications.requestPermissionsAsync();
                    finalStatus = status;
                }

                if (finalStatus !== 'granted') {
                    console.log('Failed to get push token for push notification!');
                    return;
                }

                token = (await Notifications.getExpoPushTokenAsync()).data;
                console.log('Push token:', token);
            } else {
                console.log('Must use physical device for Push Notifications');
            }

            this.expoPushToken = token;

            // שליחת הטוקן לבקנד (רק אם יש טוקן)
            if (token) {
                // שליחה ברקע בלי להפריע למשתמש
                this.sendTokenToBackend(token).catch(error => {
                    console.log('Background token registration failed:', error.message);
                });
            }

            return token;
        } catch (error) {
            console.log('Error registering for push notifications:', error.message);
            // אם יש בעיה עם projectId, נמשיך עם הודעות מקומיות בלבד
            if (error.message.includes('projectId')) {
                console.log('Push notifications disabled - using local notifications only');
            }
            return null;
        }
    }

    // שליחת הודעה מקומית
    async sendLocalNotification(title, body, data = {}) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
                sound: 'default',
            },
            trigger: null, // מיד
            channelId: Platform.OS === 'android' ? 'barbershop-notifications' : undefined,
        });
    }

    // הודעה מתוזמנת (למשל, תזכורת תור)
    async scheduleAppointmentReminder(appointmentData) {
        const { date, startTime, barberName, serviceName } = appointmentData;

        // מחשבים זמן התזכורת (24 שעות לפני התור)
        const appointmentDate = new Date(date);
        const reminderTime = new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000);

        // אם התזכורת היא בעבר, לא שולחים
        if (reminderTime < new Date()) {
            console.log('Reminder time is in the past, skipping');
            return;
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'תזכורת תור 📅',
                body: `התור שלך עם ${barberName} מחר ב-${startTime} עבור ${serviceName}`,
                data: {
                    type: 'appointment_reminder',
                    appointmentId: appointmentData.id,
                    ...appointmentData
                },
                sound: 'default',
            },
            trigger: {
                date: reminderTime,
            },
            channelId: Platform.OS === 'android' ? 'barbershop-notifications' : undefined,
        });

        console.log(`Scheduled reminder for ${reminderTime}`);
    }

    // הודעה מיידית לאחר קביעת תור
    async sendAppointmentConfirmation(appointmentData) {
        const { barberName, serviceName, date, startTime } = appointmentData;

        await this.sendLocalNotification(
            'תור נקבע בהצלחה! ✅',
            `התור שלך עם ${barberName} ב-${new Date(date).toLocaleDateString('he-IL')} בשעה ${startTime} עבור ${serviceName}`,
            {
                type: 'appointment_confirmation',
                appointmentId: appointmentData.id,
            }
        );
    }

    // הודעה על ביטול תור
    async sendAppointmentCancellation(appointmentData) {
        const { barberName, serviceName, date, startTime } = appointmentData;

        await this.sendLocalNotification(
            'תור בוטל ❌',
            `התור שלך עם ${barberName} ב-${new Date(date).toLocaleDateString('he-IL')} בשעה ${startTime} עבור ${serviceName} בוטל`,
            {
                type: 'appointment_cancellation',
                appointmentId: appointmentData.id,
            }
        );
    }

    // הודעה על שינוי תור
    async sendAppointmentUpdate(oldAppointment, newAppointment) {
        const { barberName } = oldAppointment;

        await this.sendLocalNotification(
            'תור עודכן 🔄',
            `התור שלך עם ${barberName} עודכן. בדוק את הפרטים החדשים`,
            {
                type: 'appointment_update',
                oldAppointment,
                newAppointment,
            }
        );
    }

    // הודעה על יום חופש של הספר
    async sendBarberDayOffNotification(dayOffData) {
        const { date, reason } = dayOffData;

        await this.sendLocalNotification(
            'יום חופש של הספר 📅',
            `הספר יהיה בחופש ב-${new Date(date).toLocaleDateString('he-IL')}. ${reason ? `סיבה: ${reason}` : ''}`,
            {
                type: 'barber_day_off',
                dayOffId: dayOffData.id,
            }
        );
    }

    // הודעה על הזמנה חדשה לספר
    async sendNewAppointmentToBarber(appointmentData) {
        const { customerName, serviceName, date, startTime } = appointmentData;

        await this.sendLocalNotification(
            'תור חדש! 📅',
            `לקוח חדש: ${customerName} - ${serviceName} ב-${new Date(date).toLocaleDateString('he-IL')} בשעה ${startTime}`,
            {
                type: 'new_appointment',
                appointmentId: appointmentData.id,
            }
        );
    }

    // ביטול הודעה מתוזמנת
    async cancelScheduledNotification(notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
    }

    // ביטול כל ההודעות המתוזמנות
    async cancelAllScheduledNotifications() {
        await Notifications.cancelAllScheduledNotificationsAsync();
    }

    // קבלת כל ההודעות המתוזמנות
    async getAllScheduledNotifications() {
        return await Notifications.getAllScheduledNotificationsAsync();
    }

    // הוספת מאזין להודעות
    addNotificationListener(callback) {
        return Notifications.addNotificationReceivedListener(callback);
    }

    // הוספת מאזין ללחיצה על הודעה
    addNotificationResponseListener(callback) {
        return Notifications.addNotificationResponseReceivedListener(callback);
    }

    // הסרת מאזין
    removeNotificationSubscription(subscription) {
        subscription.remove();
    }

    // שליחת טוקן לבקנד
    async sendTokenToBackend(token) {
        try {
            // בדיקה אם יש טוקן תקף לפני שליחה
            const authToken = await tokenManager.getToken();
            if (!authToken) {
                console.log('No auth token available, skipping push token registration');
                return;
            }

            const response = await fetch(`${config.BASE_URL}/users/push-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    token: token,
                    platform: Platform.OS
                })
            });

            if (response.ok) {
                console.log('Push token sent to backend successfully');
            } else if (response.status === 401) {
                console.log('Authentication failed - token may be expired');
                // לא ננסה שוב כי הטוקן לא תקף
            } else {
                console.log('Failed to send push token to backend, status:', response.status);
            }
        } catch (error) {
            console.log('Error sending push token to backend:', error.message);
            // לא נדפיס את כל הפרטים של השגיאה כדי לא להציף את הלוג
        }
    }
}

// יצירת instance יחיד
const notificationManager = new NotificationManager();

export default notificationManager;
