import { MaterialCommunityIcons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import React, { useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import config from '../config'

export default function HaircutHistory() {
    const [loading, setLoading] = useState(true)
    const [appointments, setAppointments] = useState([])
    const [error, setError] = useState('')

    React.useEffect(() => {
        fetchHaircutHistory()
    }, [])

    const fetchHaircutHistory = async () => {
        setLoading(true)
        setError('')
        try {
            const accessToken = await AsyncStorage.getItem('accessToken')
            const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}

            // כאן צריך להתאים לנתיב האמיתי של הבקנד
            const res = await fetch(`${config.BASE_URL}/users/appointments/past`, { headers })
            const json = await res.json()

            if (!res.ok) throw new Error(json?.error || 'Failed to load haircut history')

            setAppointments(json.appointments || [])
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load haircut history')
            // אם אין נתונים אמיתיים, נציג נתונים לדוגמה
            setAppointments([])
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const formatTime = (timeString) => {
        if (!timeString) return ''
        return timeString.substring(0, 5) // מחזיר רק שעות ודקות (HH:MM)
    }

    const getBarberFullName = (barber) => {
        if (!barber) return 'לא ידוע'
        return `${barber.firstName || ''} ${barber.lastName || ''}`.trim()
    }

    const getStatusText = (status) => {
        switch (status) {
            case 'completed':
                return 'הושלם'
            case 'cancelled':
                return 'בוטל'
            case 'no-show':
                return 'לא הגיע'
            default:
                return status
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return '#10b981'
            case 'cancelled':
                return '#ef4444'
            case 'no-show':
                return '#f59e0b'
            default:
                return '#6b7280'
        }
    }



    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <View style={styles.loadingSpinner}>
                    <MaterialCommunityIcons name="refresh" size={48} color="#3b82f6" />
                </View>
                <Text style={styles.loadingText}>טוען היסטוריית תספורות...</Text>
            </View>
        )
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-right" size={24} color="#111827" />
                </Pressable>
                <Text style={styles.title}>היסטוריית תספורות</Text>
            </View>

            {!!error && (
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={24} color="#ef4444" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {appointments.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="scissors-cutting" size={64} color="#9ca3af" />
                    <Text style={styles.emptyTitle}>אין היסטוריית תספורות</Text>
                    <Text style={styles.emptySubtitle}>עדיין לא ביצעת תספורות</Text>
                </View>
            ) : (
                <View style={styles.appointmentsContainer}>
                    {appointments.map((appointment) => (
                        <View key={appointment._id} style={styles.appointmentCard}>
                            <View style={styles.appointmentHeader}>
                                <View style={styles.barberInfo}>
                                    <View style={styles.barberAvatar}>
                                        {appointment.barber?.profileImage ? (
                                            <Image source={{ uri: appointment.barber.profileImage }} style={styles.barberAvatarImage} />
                                        ) : (
                                            <MaterialCommunityIcons name="account" size={24} color="#6b7280" />
                                        )}
                                    </View>
                                    <View>
                                        <Text style={styles.barberName}>{getBarberFullName(appointment.barber)}</Text>
                                        <Text style={styles.serviceName}>{appointment.service?.name || 'שירות לא ידוע'}</Text>
                                    </View>
                                </View>
                                <View style={styles.statusContainer}>
                                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) + '20' }]}>
                                        <Text style={[styles.statusText, { color: getStatusColor(appointment.status) }]}>
                                            {getStatusText(appointment.status)}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.appointmentDetails}>
                                <View style={styles.detailRow}>
                                    <MaterialCommunityIcons name="calendar" size={16} color="#6b7280" />
                                    <Text style={styles.detailText}>{formatDate(appointment.date)}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <MaterialCommunityIcons name="clock-outline" size={16} color="#6b7280" />
                                    <Text style={styles.detailText}>
                                        {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                                    </Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <MaterialCommunityIcons name="currency-ils" size={16} color="#6b7280" />
                                    <Text style={styles.detailText}>₪{appointment.totalPrice}</Text>
                                </View>
                                {appointment.service?.durationMinutes && (
                                    <View style={styles.detailRow}>
                                        <MaterialCommunityIcons name="timer-outline" size={16} color="#6b7280" />
                                        <Text style={styles.detailText}>{appointment.service.durationMinutes} דקות</Text>
                                    </View>
                                )}
                            </View>

                            {appointment.notes && (
                                <View style={styles.notesContainer}>
                                    <Text style={styles.notesLabel}>הערות:</Text>
                                    <Text style={styles.notesText}>{appointment.notes}</Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            )}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        gap: 16,
        backgroundColor: '#f8fafc'
    },
    header: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8
    },
    backButton: {
        padding: 8
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        flex: 1,
        textAlign: 'right'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        gap: 16
    },
    loadingSpinner: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#dbeafe'
    },
    loadingText: {
        fontSize: 16,
        color: '#6b7280',
        fontWeight: '500'
    },
    errorContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fef2f2',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#fecaca'
    },
    errorText: {
        color: '#b91c1c',
        fontSize: 14
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 48,
        gap: 12
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151'
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6b7280'
    },
    appointmentsContainer: {
        gap: 12
    },
    appointmentCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 16,
        gap: 12
    },
    appointmentHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    barberInfo: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 12
    },
    barberAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
    },
    barberAvatarImage: {
        width: '100%',
        height: '100%'
    },
    barberName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827'
    },
    serviceName: {
        fontSize: 14,
        color: '#6b7280'
    },
    statusContainer: {
        alignItems: 'flex-start'
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500'
    },
    appointmentDetails: {
        gap: 8
    },
    detailRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8
    },
    detailText: {
        fontSize: 14,
        color: '#374151'
    },
    notesContainer: {
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        gap: 4
    },
    notesLabel: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500'
    },
    notesText: {
        fontSize: 14,
        color: '#374151',
        fontStyle: 'italic'
    }
})
