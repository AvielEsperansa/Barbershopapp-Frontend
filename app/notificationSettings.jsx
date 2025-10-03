import { MaterialCommunityIcons } from '@expo/vector-icons'
import React, { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
// import config from '../config'
// import apiClient from '../lib/apiClient'
import notificationManager from '../lib/notificationManager'
import SafeScreen from './components/SafeScreen'

export default function NotificationSettings() {
    const [notifications, setNotifications] = useState({
        appointmentReminders: true,
        newAppointments: true,
        cancellations: true,
        dayOffs: true,
        promotions: false,
    })
    // const [loading, setLoading] = useState(false)

    const [scheduledNotifications, setScheduledNotifications] = useState([])

    useEffect(() => {
        loadScheduledNotifications()
        loadNotificationPreferences()
    }, [])

    const loadNotificationPreferences = async () => {
        try {
            // TODO: טעינת העדפות מהשרת
            // const response = await apiClient.get(`${config.BASE_URL}/users/notification-preferences`)
            // if (response.ok) {
            //     const data = await response.json()
            //     setNotifications(data.preferences)
            // }
        } catch (error) {
            console.log('Failed to load notification preferences:', error)
        }
    }

    const loadScheduledNotifications = async () => {
        try {
            const notifications = await notificationManager.getAllScheduledNotifications()
            setScheduledNotifications(notifications)
        } catch (error) {
            console.log('Failed to load scheduled notifications:', error)
        }
    }

    const toggleNotification = async (type) => {
        const newValue = !notifications[type]
        setNotifications(prev => ({
            ...prev,
            [type]: newValue
        }))

        // שמירת ההעדפה בשרת
        await saveNotificationPreference(type, newValue)
    }

    const saveNotificationPreference = async (type, value) => {
        try {
            // TODO: שמירת העדפה בשרת
            // const response = await apiClient.put(`${config.BASE_URL}/users/notification-preferences`, {
            //     [type]: value
            // })
            // if (response.ok) {
            //     console.log('Notification preference saved:', type, value)
            // } else {
            //     console.log('Failed to save notification preference')
            // }
            console.log('Notification preference changed:', type, value)
        } catch (error) {
            console.log('Error saving notification preference:', error)
        }
    }

    const sendTestNotification = async () => {
        try {
            await notificationManager.sendLocalNotification(
                'הודעת בדיקה 🧪',
                'זוהי הודעת בדיקה למערכת ההודעות',
                { type: 'test' }
            )
            Alert.alert('הצלחה', 'הודעת בדיקה נשלחה')
        } catch (error) {
            console.log(error)
            Alert.alert('שגיאה', error.message || 'נכשל לשלוח הודעת בדיקה')
        }
    }

    const clearAllNotifications = async () => {
        Alert.alert(
            'מחיקת כל ההודעות',
            'האם אתה בטוח שברצונך למחוק את כל ההודעות המתוזמנות?',
            [
                { text: 'ביטול', style: 'cancel' },
                {
                    text: 'מחק הכל',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await notificationManager.cancelAllScheduledNotifications()
                            await loadScheduledNotifications()
                            Alert.alert('הצלחה', 'כל ההודעות נמחקו')
                        } catch (error) {
                            console.log(error)
                            Alert.alert('שגיאה', error.message || 'נכשל למחוק את ההודעות')
                        }
                    }
                }
            ]
        )
    }

    const NotificationRow = ({ icon, title, subtitle, value, onToggle, testAction }) => (
        <View style={styles.notificationRow}>
            <View style={styles.notificationInfo}>
                <MaterialCommunityIcons name={icon} size={24} color="#3b82f6" />
                <View style={styles.notificationText}>
                    <Text style={styles.notificationTitle}>{title}</Text>
                    <Text style={styles.notificationSubtitle}>{subtitle}</Text>
                </View>
            </View>
            <View style={styles.notificationActions}>
                {testAction && (
                    <Pressable style={styles.testButton} onPress={testAction}>
                        <MaterialCommunityIcons name="test-tube" size={16} color="#ffffff" />
                        <Text style={styles.testButtonText}>בדיקה</Text>
                    </Pressable>
                )}
                <Switch
                    value={value}
                    onValueChange={onToggle}
                    trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
                    thumbColor={value ? '#ffffff' : '#f3f4f6'}
                />
            </View>
        </View>
    )

    return (
        <SafeScreen backgroundColor="#f8fafc">
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <MaterialCommunityIcons name="bell" size={48} color="#3b82f6" />
                    <Text style={styles.title}>הגדרות הודעות</Text>
                    <Text style={styles.subtitle}>נהל את ההודעות והתראות שלך</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>סוגי הודעות</Text>

                    <NotificationRow
                        icon="calendar-clock"
                        title="תזכורות תורים"
                        subtitle="הודעות 24 שעות לפני התור"
                        value={notifications.appointmentReminders}
                        onToggle={() => toggleNotification('appointmentReminders')}
                    />

                    <NotificationRow
                        icon="calendar-plus"
                        title="תורים חדשים"
                        subtitle="הודעות על תורים חדשים שנקבעו"
                        value={notifications.newAppointments}
                        onToggle={() => toggleNotification('newAppointments')}
                    />

                    <NotificationRow
                        icon="calendar-remove"
                        title="ביטולי תורים"
                        subtitle="הודעות על ביטולי תורים"
                        value={notifications.cancellations}
                        onToggle={() => toggleNotification('cancellations')}
                    />

                    <NotificationRow
                        icon="calendar-off"
                        title="ימי חופש"
                        subtitle="הודעות על ימי חופש של הספר"
                        value={notifications.dayOffs}
                        onToggle={() => toggleNotification('dayOffs')}
                    />

                    <NotificationRow
                        icon="gift"
                        title="הנחות וקופונים"
                        subtitle="הודעות על הנחות וקופונים חדשים"
                        value={notifications.promotions}
                        onToggle={() => toggleNotification('promotions')}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>הודעות מתוזמנות</Text>
                    <Text style={styles.sectionSubtitle}>
                        {scheduledNotifications.length} הודעות מתוזמנות
                    </Text>

                    {scheduledNotifications.length > 0 ? (
                        scheduledNotifications.map((notification, index) => (
                            <View key={index} style={styles.scheduledNotification}>
                                <View style={styles.scheduledInfo}>
                                    <MaterialCommunityIcons name="clock" size={20} color="#6b7280" />
                                    <View>
                                        <Text style={styles.scheduledTitle}>
                                            {notification.content.title}
                                        </Text>
                                        <Text style={styles.scheduledBody}>
                                            {notification.content.body}
                                        </Text>
                                        <Text style={styles.scheduledDate}>
                                            {new Date(notification.trigger.value).toLocaleString('he-IL')}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="bell-off" size={48} color="#9ca3af" />
                            <Text style={styles.emptyText}>אין הודעות מתוזמנות</Text>
                        </View>
                    )}

                    {scheduledNotifications.length > 0 && (
                        <Pressable style={styles.clearButton} onPress={clearAllNotifications}>
                            <MaterialCommunityIcons name="delete-sweep" size={20} color="#ef4444" />
                            <Text style={styles.clearButtonText}>מחק כל ההודעות</Text>
                        </Pressable>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>בדיקות</Text>

                    <Pressable style={styles.testSection} onPress={sendTestNotification}>
                        <MaterialCommunityIcons name="test-tube" size={24} color="#10b981" />
                        <View style={styles.testInfo}>
                            <Text style={styles.testTitle}>שלח הודעת בדיקה</Text>
                            <Text style={styles.testSubtitle}>בדוק שההודעות עובדות</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-left" size={24} color="#9ca3af" />
                    </Pressable>
                </View>
            </ScrollView>
        </SafeScreen>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        paddingBottom: 100
    },
    header: {
        alignItems: 'center',
        paddingVertical: 24,
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginTop: 12,
        marginBottom: 4
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center'
    },
    section: {
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        overflow: 'hidden'
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        padding: 16,
        paddingBottom: 8,
        textAlign: 'right'
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        paddingHorizontal: 16,
        paddingBottom: 16,
        textAlign: 'right'
    },
    notificationRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6'
    },
    notificationInfo: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        flex: 1,
        gap: 12
    },
    notificationText: {
        flex: 1
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        textAlign: 'right'
    },
    notificationSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'right',
        marginTop: 2
    },
    notificationActions: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 12
    },
    testButton: {
        backgroundColor: '#10b981',
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6
    },
    testButtonText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600'
    },
    scheduledNotification: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6'
    },
    scheduledInfo: {
        flexDirection: 'row-reverse',
        alignItems: 'flex-start',
        gap: 12
    },
    scheduledTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        textAlign: 'right'
    },
    scheduledBody: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'right',
        marginTop: 2
    },
    scheduledDate: {
        fontSize: 12,
        color: '#9ca3af',
        textAlign: 'right',
        marginTop: 4
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        gap: 12
    },
    emptyText: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'right'
    },
    clearButton: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        margin: 16,
        borderRadius: 12,
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca'
    },
    clearButtonText: {
        color: '#ef4444',
        fontWeight: '600',
        fontSize: 16
    },
    testSection: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        gap: 12
    },
    testInfo: {
        flex: 1
    },
    testTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        textAlign: 'right'
    },
    testSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'right',
        marginTop: 2
    }
})
