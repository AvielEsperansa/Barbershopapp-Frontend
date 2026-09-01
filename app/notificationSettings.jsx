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
                <MaterialCommunityIcons name={icon} size={24} color="#ef4444" />
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
                    trackColor={{ false: '#27272a', true: '#dc2626' }}
                    thumbColor={value ? '#ffffff' : '#71717a'}
                />
            </View>
        </View>
    )

    return (
        <SafeScreen backgroundColor="#09090b">
            <ScrollView style={{ backgroundColor: "#09090b" }} contentContainerStyle={styles.container}>
                {/* Glowing Red Background Orbs */}
                <View style={styles.orbTopRight} />
                <View style={styles.orbBottomLeft} />

                <View style={styles.header}>
                    <MaterialCommunityIcons name="bell" size={48} color="#ef4444" />
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
        paddingTop: 16,
        paddingBottom: 100,
        backgroundColor: '#09090b',
    },
    orbTopRight: {
        position: 'absolute',
        top: -60,
        right: -60,
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
    },
    orbBottomLeft: {
        position: 'absolute',
        bottom: -60,
        left: -60,
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: 'rgba(220, 38, 38, 0.08)',
    },
    header: {
        alignItems: 'center',
        paddingVertical: 24,
        backgroundColor: 'rgba(24, 24, 27, 0.85)',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)'
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#ffffff',
        marginTop: 12,
        marginBottom: 4
    },
    subtitle: {
        fontSize: 14,
        color: '#a1a1aa',
        textAlign: 'center'
    },
    section: {
        backgroundColor: 'rgba(24, 24, 27, 0.85)',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)',
        overflow: 'hidden'
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
        padding: 16,
        paddingBottom: 8,
        textAlign: 'right'
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#a1a1aa',
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
        borderTopColor: 'rgba(39, 39, 42, 0.8)'
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
        color: '#ffffff',
        textAlign: 'right'
    },
    notificationSubtitle: {
        fontSize: 14,
        color: '#a1a1aa',
        textAlign: 'right',
        marginTop: 2
    },
    notificationActions: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 12
    },
    testButton: {
        backgroundColor: '#dc2626',
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
        borderTopColor: 'rgba(39, 39, 42, 0.8)'
    },
    scheduledInfo: {
        flexDirection: 'row-reverse',
        alignItems: 'flex-start',
        gap: 12
    },
    scheduledTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        textAlign: 'right'
    },
    scheduledBody: {
        fontSize: 14,
        color: '#a1a1aa',
        textAlign: 'right',
        marginTop: 2
    },
    scheduledDate: {
        fontSize: 12,
        color: '#71717a',
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
        color: '#a1a1aa',
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
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)'
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
        borderTopColor: 'rgba(39, 39, 42, 0.8)',
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
