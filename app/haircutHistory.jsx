import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native'
import config from '../config'
import apiClient from '../lib/apiClient'
import SafeScreen from './components/SafeScreen'

export default function HaircutHistory() {
    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchHaircutHistory()
    }, [])

    const fetchHaircutHistory = async () => {
        try {
            setLoading(true)
            setError('')

            console.log('🔍 Fetching customer haircut history')

            // נקבל את היסטוריית התספורות של הלקוח
            const response = await apiClient.get(`${config.BASE_URL}/users/appointments/past`)

            if (response.ok) {
                const data = await response.json()
                console.log('✅ Haircut history received:', data)

                // נסנן רק תורים בעבר
                const todayKey = new Date().toISOString().split('T')[0]
                const pastAppointments = (data.appointments || []).filter(appointment => {
                    const appointmentDate = new Date(appointment.date).toISOString().split('T')[0]
                    return appointmentDate < todayKey
                })

                setAppointments(pastAppointments)
            } else {
                console.error('❌ Failed to fetch haircut history:', response.status)
                const errorText = await response.text()
                console.error('❌ Error response:', errorText)
                throw new Error('לא ניתן לטעון היסטוריית תספורות')
            }
        } catch (error) {
            console.error('❌ Error fetching haircut history:', error)
            setError(error.message || 'אירעה שגיאה בטעינת היסטוריית התספורות')
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



    if (loading) {
        return (
            <SafeScreen backgroundColor="#f8fafc">
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={styles.loadingText}>טוען היסטוריית תספורות...</Text>
                </View>
            </SafeScreen>
        )
    }

    if (error) {
        return (
            <SafeScreen paddingTop={-20} backgroundColor="#f8fafc">
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={48} color="#ef4444" />
                    <Text style={styles.errorText}>{error}</Text>
                    <Pressable style={styles.retryButton} onPress={fetchHaircutHistory}>
                        <Text style={styles.retryButtonText}>נסה שוב</Text>
                    </Pressable>
                </View>
            </SafeScreen>
        )
    }

    return (
        <SafeScreen paddingTop={-20} backgroundColor="#f8fafc">
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-right" size={24} color="#111827" />
                        <Text style={styles.backText}>חזרה</Text>
                    </Pressable>
                    <Text style={styles.title}>היסטוריית תספורות</Text>
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <MaterialCommunityIcons name="scissors-cutting" size={32} color="#10b981" />
                        <Text style={styles.statNumber}>{appointments.length}</Text>
                        <Text style={styles.statLabel}>תספורות שבוצעו</Text>
                    </View>

                    <View style={styles.statCard}>
                        <MaterialCommunityIcons name="star" size={32} color="#f59e0b" />
                        <Text style={styles.statNumber}>
                            {appointments.length > 0
                                ? (appointments.reduce((sum, app) => sum + (app.totalPrice || 0), 0) / appointments.length).toFixed(0)
                                : '0'
                            }
                        </Text>
                        <Text style={styles.statLabel}>מחיר ממוצע</Text>
                    </View>
                </View>

                {/* Appointments List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>היסטוריית התספורות שלי</Text>

                    {appointments.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="scissors-cutting" size={48} color="#9ca3af" />
                            <Text style={styles.emptyText}>אין היסטוריית תספורות</Text>
                            <Text style={styles.emptySubtext}>התספורות שבוצעו יופיעו כאן</Text>
                        </View>
                    ) : (
                        appointments.map((appointment, index) => (
                            <View key={appointment._id || index} style={styles.appointmentCard}>
                                <View style={styles.appointmentHeader}>
                                    <View style={styles.customerInfo}>
                                        <MaterialCommunityIcons name="account" size={20} color="#6b7280" />
                                        <Text style={styles.customerName}>
                                            {appointment.barber?.firstName || 'ספר לא ידוע'}
                                        </Text>
                                    </View>
                                    <View style={styles.ratingContainer}>
                                        {appointment.totalPrice ? (
                                            <>
                                                <MaterialCommunityIcons name="currency-ils" size={16} color="#10b981" />
                                                <Text style={styles.ratingText}>{appointment.totalPrice}</Text>
                                            </>
                                        ) : (
                                            <Text style={styles.noRatingText}>ללא מחיר</Text>
                                        )}
                                    </View>
                                </View>

                                <View style={styles.appointmentDetails}>
                                    <View style={styles.detailRow}>
                                        <MaterialCommunityIcons name="calendar" size={16} color="#6b7280" />
                                        <Text style={styles.detailText}>
                                            {formatDate(appointment.date)}
                                        </Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <MaterialCommunityIcons name="clock" size={16} color="#6b7280" />
                                        <Text style={styles.detailText}>
                                            {appointment.startTime} - {appointment.endTime}
                                        </Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <MaterialCommunityIcons name="scissors-cutting" size={16} color="#6b7280" />
                                        <Text style={styles.detailText}>
                                            {appointment.service?.name || 'תספורת'}
                                        </Text>
                                    </View>
                                </View>

                                {appointment.notes && (
                                    <View style={styles.notesContainer}>
                                        <Text style={styles.notesLabel}>הערות:</Text>
                                        <Text style={styles.notesText}>{appointment.notes}</Text>
                                    </View>
                                )}
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeScreen>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc'
    },
    content: {
        padding: 16,
        gap: 16,
        paddingBottom: 100
    },
    header: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8
    },
    backButton: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 4,
        padding: 8
    },
    backText: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '500'
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        flex: 1,
        textAlign: 'right'
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12
    },
    statCard: {
        flex: 1,
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginTop: 8,
        marginBottom: 4
    },
    statLabel: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center'
    },
    section: {
        backgroundColor: '#ffffff',
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
    emptyContainer: {
        alignItems: 'center',
        padding: 40,
        gap: 12
    },
    emptyText: {
        fontSize: 18,
        color: '#6b7280',
        textAlign: 'center'
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center'
    },
    appointmentCard: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        gap: 12
    },
    appointmentHeader: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    customerInfo: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8
    },
    customerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827'
    },
    ratingContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 4
    },
    ratingText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#10b981'
    },
    noRatingText: {
        fontSize: 14,
        color: '#9ca3af'
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
        color: '#6b7280'
    },
    notesContainer: {
        backgroundColor: '#f9fafb',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    notesLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
        textAlign: 'right'
    },
    notesText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'right',
        lineHeight: 20
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        gap: 16
    },
    loadingText: {
        fontSize: 18,
        color: '#6b7280'
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: 20,
        gap: 16
    },
    errorText: {
        fontSize: 18,
        color: '#ef4444',
        textAlign: 'center'
    },
    retryButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8
    },
    retryButtonText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 16
    }
})
