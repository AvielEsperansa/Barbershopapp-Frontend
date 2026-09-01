import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Calendar } from 'react-native-calendars'
import config from '../../config'
import apiClient from '../../lib/apiClient'

export default function Dashboard() {
    const [barberId, setBarberId] = useState('')
    const [barberUser, setBarberUser] = useState(null)
    const [loading, setLoading] = useState(false)
    const [appointmentsByDate, setAppointmentsByDate] = useState({})
    const [markedDates, setMarkedDates] = useState({})
    const [selectedDate, setSelectedDate] = useState('')
    const [showDayModal, setShowDayModal] = useState(false)
    const [ratingStats, setRatingStats] = useState(null)

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const response = await apiClient.get(`${config.BASE_URL}/users/profile`)
                if (response.ok) {
                    const data = await response.json()
                    setBarberId(data.user._id)
                    setBarberUser(data.user)
                }
            } catch { }
        }
        loadProfile()
    }, [])

    useEffect(() => {
        const loadRatingStats = async () => {
            if (!barberId) return
            try {
                const response = await apiClient.get(`${config.BASE_URL}/ratings/barber/${barberId}/stats`)
                if (response.ok) {
                    const data = await response.json()
                    setRatingStats(data.stats || data)
                }
            } catch (error) {
                console.error('Error loading rating stats:', error)
            }
        }
        loadRatingStats()
    }, [barberId])

    useEffect(() => {
        const loadAppointments = async () => {
            if (!barberId) return
            try {
                setLoading(true)
                const response = await apiClient.get(`${config.BASE_URL}/appointments/barber/customers?type=all`)
                if (!response.ok) return
                const data = await response.json()
                let allAppointments = []
                if (data.customers && Array.isArray(data.customers)) {
                    data.customers.forEach(customerData => {
                        if (customerData.appointments && Array.isArray(customerData.appointments)) {
                            allAppointments = allAppointments.concat(customerData.appointments)
                        }
                    })
                }

                // קיבוץ לפי תאריך (YYYY-MM-DD)
                const map = {}
                allAppointments.forEach(appt => {
                    if (!appt?.date) return
                    const key = new Date(appt.date).toISOString().split('T')[0]
                    if (!map[key]) map[key] = []
                    map[key].push(appt)
                })

                setAppointmentsByDate(map)
                // סימון נקודה כחולה על ימים עם לפחות תספורת אחת
                const marks = {}
                Object.keys(map).forEach(key => {
                    if (map[key]?.length > 0) {
                        marks[key] = { marked: true, dotColor: '#2563eb' }
                    }
                })
                setMarkedDates(marks)
            } catch {
            } finally {
                setLoading(false)
            }
        }
        loadAppointments()
    }, [barberId])

    const dayAppointments = useMemo(() => {
        if (!selectedDate) return []
        return appointmentsByDate[selectedDate] || []
    }, [appointmentsByDate, selectedDate])

    const todayKey = useMemo(() => new Date().toISOString().split('T')[0], [])
    const todaysAppointments = useMemo(() => appointmentsByDate[todayKey] || [], [appointmentsByDate, todayKey])

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour >= 5 && hour < 12) return 'בוקר טוב ☀️'
        if (hour >= 12 && hour < 17) return 'צהריים טובים 🌤️'
        if (hour >= 17 && hour < 22) return 'ערב טוב 🌙'
        return 'לילה טוב 🌌'
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerIconWrap}>
                        <MaterialCommunityIcons name="view-dashboard-variant" size={28} color="#3b82f6" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.greetingText}>{getGreeting()}</Text>
                        <Text style={styles.title}>
                            {barberUser?.firstName ? `${barberUser.firstName} ${barberUser.lastName || ''}`.trim() : 'דשבורד הספר'} ✂️
                        </Text>
                        <Text style={styles.subtitle}>דשבורד ניהול המספרה</Text>
                    </View>
                </View>

                {/* Stats Row */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                            <MaterialCommunityIcons name="calendar-check" size={22} color="#10b981" />
                        </View>
                        <Text style={styles.statNumber}>{todaysAppointments.length}</Text>
                        <Text style={styles.statLabel}>תורים היום</Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={[styles.statIconWrap, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                            <MaterialCommunityIcons name="clock-outline" size={22} color="#3b82f6" />
                        </View>
                        <Text style={styles.statNumber}>3</Text>
                        <Text style={styles.statLabel}>ממתינים</Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={[styles.statIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                            <MaterialCommunityIcons name="star" size={22} color="#f59e0b" />
                        </View>
                        <Text style={styles.statNumber}>
                            {ratingStats?.averageRating ? ratingStats.averageRating.toFixed(1) : '0.0'}
                        </Text>
                        <Text style={styles.statLabel}>דירוג ממוצע</Text>
                        {!!ratingStats?.totalRatings && (
                            <Text style={styles.ratingCount}>({ratingStats.totalRatings} דירוגים)</Text>
                        )}
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <Text style={styles.sectionTitle}>פעולות מהירות</Text>

                    <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(barberTabs)/Appointments')}>
                        <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                            <MaterialCommunityIcons name="calendar-plus" size={22} color="#3b82f6" />
                        </View>
                        <Text style={styles.actionText}>הוסף זמינות חדשה</Text>
                        <MaterialCommunityIcons name="chevron-left" size={20} color="#475569" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(barberTabs)/Customers')}>
                        <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                            <MaterialCommunityIcons name="account-multiple" size={22} color="#10b981" />
                        </View>
                        <Text style={styles.actionText}>צפה בלקוחות</Text>
                        <MaterialCommunityIcons name="chevron-left" size={20} color="#475569" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/manageAnnouncements')}>
                        <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                            <MaterialCommunityIcons name="bullhorn" size={22} color="#ef4444" />
                        </View>
                        <Text style={styles.actionText}>ניהול הודעות ועדכונים</Text>
                        <MaterialCommunityIcons name="chevron-left" size={20} color="#475569" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/manageGallery')}>
                        <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                            <MaterialCommunityIcons name="image-multiple" size={22} color="#a855f7" />
                        </View>
                        <Text style={styles.actionText}>ניהול גלריית עבודות</Text>
                        <MaterialCommunityIcons name="chevron-left" size={20} color="#475569" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/barberReports')}>
                        <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                            <MaterialCommunityIcons name="chart-line" size={22} color="#f59e0b" />
                        </View>
                        <Text style={styles.actionText}>דוחות וסטטיסטיקות</Text>
                        <MaterialCommunityIcons name="chevron-left" size={20} color="#475569" />
                    </TouchableOpacity>
                </View>

                {/* Calendar */}
                <View style={styles.calendarSection}>
                    <Text style={styles.sectionTitle}>לוח תספורות</Text>
                    {loading ? (
                        <View style={styles.loadingState}>
                            <ActivityIndicator size="large" color="#3b82f6" />
                            <Text style={styles.loadingText}>טוען נתונים...</Text>
                        </View>
                    ) : (
                        <View style={styles.calendarCard}>
                            <Calendar
                                onDayPress={(day) => {
                                    const key = day.dateString
                                    setSelectedDate(key)
                                    if ((appointmentsByDate[key] || []).length > 0) {
                                        setShowDayModal(true)
                                    }
                                }}
                                markedDates={markedDates}
                                theme={{
                                    backgroundColor: '#1e293b',
                                    calendarBackground: '#1e293b',
                                    textSectionTitleColor: '#94a3b8',
                                    selectedDayBackgroundColor: '#3b82f6',
                                    selectedDayTextColor: '#ffffff',
                                    todayTextColor: '#3b82f6',
                                    dayTextColor: '#e2e8f0',
                                    textDisabledColor: '#475569',
                                    monthTextColor: '#f1f5f9',
                                    arrowColor: '#3b82f6',
                                    textDayFontWeight: '500',
                                    textMonthFontWeight: '700',
                                    textDayHeaderFontWeight: '600',
                                }}
                                minDate={new Date(2000, 0, 1).toISOString().split('T')[0]}
                                maxDate={new Date(2100, 11, 31).toISOString().split('T')[0]}
                            />
                        </View>
                    )}
                </View>

                {/* Today's Appointments */}
                <View style={styles.todaySection}>
                    <Text style={styles.sectionTitle}>תורים היום</Text>
                    {loading ? (
                        <View style={styles.loadingState}>
                            <ActivityIndicator size="small" color="#3b82f6" />
                            <Text style={styles.loadingText}>טוען תורים...</Text>
                        </View>
                    ) : todaysAppointments.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="calendar-remove" size={48} color="#475569" />
                            <Text style={styles.emptyText}>אין תורים היום</Text>
                        </View>
                    ) : (
                        <ScrollView style={styles.dayList} showsVerticalScrollIndicator={false}>
                            {todaysAppointments
                                .slice()
                                .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
                                .map(appt => (
                                    <View key={appt._id || `${appt.date}-${appt.startTime}`} style={styles.apptCard}>
                                        <View style={styles.apptHeader}>
                                            <View style={styles.apptDateTimeInfo}>
                                                <MaterialCommunityIcons name="clock-outline" size={16} color="#3b82f6" />
                                                <Text style={styles.apptTime}>{appt.startTime}</Text>
                                            </View>
                                            <View style={styles.statusBadge}>
                                                <Text style={styles.statusText}>מאושר</Text>
                                            </View>
                                        </View>
                                        <View style={styles.apptDetails}>
                                            <View style={styles.detailRow}>
                                                <MaterialCommunityIcons name="account" size={15} color="#64748b" />
                                                <Text style={styles.apptCustomer}>
                                                    {appt.customer?.firstName} {appt.customer?.lastName}
                                                </Text>
                                            </View>
                                            <View style={styles.detailRow}>
                                                <MaterialCommunityIcons name="content-cut" size={15} color="#64748b" />
                                                <Text style={styles.apptService}>{appt.service?.name || '—'}</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                        </ScrollView>
                    )}
                </View>
            </ScrollView>

            {/* Day Modal */}
            <Modal
                visible={showDayModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowDayModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>תספורות בתאריך {selectedDate}</Text>
                            <TouchableOpacity onPress={() => setShowDayModal(false)} style={styles.modalCloseButton}>
                                <MaterialCommunityIcons name="close-circle" size={26} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {dayAppointments.length === 0 ? (
                            <View style={styles.emptyState}>
                                <MaterialCommunityIcons name="calendar-remove" size={48} color="#475569" />
                                <Text style={styles.emptyText}>אין תספורות ביום זה</Text>
                            </View>
                        ) : (
                            <ScrollView style={styles.dayList} showsVerticalScrollIndicator={false}>
                                {dayAppointments
                                    .slice()
                                    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
                                    .map(appt => (
                                        <View key={appt._id || `${appt.date}-${appt.startTime}`} style={styles.apptCard}>
                                            <View style={styles.apptHeader}>
                                                <View style={styles.apptDateTimeInfo}>
                                                    <MaterialCommunityIcons name="clock-outline" size={16} color="#3b82f6" />
                                                    <Text style={styles.apptTime}>{appt.startTime}</Text>
                                                </View>
                                                <View style={styles.statusBadge}>
                                                    <Text style={styles.statusText}>מאושר</Text>
                                                </View>
                                            </View>

                                            <View style={styles.apptDetails}>
                                                <View style={styles.detailRow}>
                                                    <MaterialCommunityIcons name="account" size={15} color="#64748b" />
                                                    <Text style={styles.apptCustomer}>
                                                        {appt.customer?.firstName} {appt.customer?.lastName}
                                                    </Text>
                                                </View>
                                                <View style={styles.detailRow}>
                                                    <MaterialCommunityIcons name="content-cut" size={15} color="#64748b" />
                                                    <Text style={styles.apptService}>{appt.service?.name || '—'}</Text>
                                                </View>
                                                {!!appt.totalPrice && (
                                                    <View style={styles.detailRow}>
                                                        <MaterialCommunityIcons name="cash" size={15} color="#64748b" />
                                                        <Text style={styles.apptPrice}>₪{appt.totalPrice}</Text>
                                                    </View>
                                                )}
                                                {!!appt.service?.durationMinutes && (
                                                    <View style={styles.detailRow}>
                                                        <MaterialCommunityIcons name="timer" size={15} color="#64748b" />
                                                        <Text style={styles.apptDuration}>{appt.service?.durationMinutes} דקות</Text>
                                                    </View>
                                                )}
                                                {!!appt.notes && (
                                                    <View style={styles.detailRow}>
                                                        <MaterialCommunityIcons name="note-text" size={15} color="#64748b" />
                                                        <Text style={styles.apptNotes}>{appt.notes}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    ))}
                            </ScrollView>
                        )}

                        <View style={styles.modalActions}>
                            <Pressable style={styles.cancelModalButton} onPress={() => setShowDayModal(false)}>
                                <Text style={styles.cancelModalButtonText}>סגור</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    header: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 18,
        gap: 14,
    },
    headerIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    greetingText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#3b82f6',
        textAlign: 'right',
        marginBottom: 2,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#f1f5f9',
        textAlign: 'right',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'right',
        marginTop: 2,
    },
    statsContainer: {
        flexDirection: 'row-reverse',
        paddingHorizontal: 16,
        marginBottom: 20,
        gap: 10,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#1e293b',
        padding: 14,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.12)',
    },
    statIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statNumber: {
        fontSize: 22,
        fontWeight: '800',
        color: '#f1f5f9',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        color: '#94a3b8',
        textAlign: 'center',
    },
    ratingCount: {
        fontSize: 10,
        color: '#64748b',
        textAlign: 'center',
        marginTop: 2,
    },
    quickActions: {
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#e2e8f0',
        marginBottom: 14,
        textAlign: 'right',
    },
    actionCard: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        padding: 14,
        borderRadius: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
        gap: 12,
    },
    actionIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionText: {
        flex: 1,
        fontSize: 15,
        color: '#e2e8f0',
        fontWeight: '600',
        textAlign: 'right',
    },
    calendarSection: {
        paddingHorizontal: 16,
        marginTop: 8,
    },
    calendarCard: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.12)',
    },
    todaySection: {
        paddingHorizontal: 16,
        marginTop: 20,
    },
    loadingState: {
        alignItems: 'center',
        padding: 24,
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
    },
    dayList: {
        maxHeight: 420,
    },
    apptCard: {
        backgroundColor: '#1e293b',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
    },
    apptHeader: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    apptDateTimeInfo: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 6,
    },
    apptTime: {
        fontSize: 16,
        fontWeight: '700',
        color: '#f1f5f9',
        textAlign: 'right',
    },
    apptDetails: {
        gap: 6,
    },
    detailRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8,
    },
    apptCustomer: {
        fontSize: 14,
        color: '#e2e8f0',
        textAlign: 'right',
    },
    apptService: {
        fontSize: 13,
        color: '#94a3b8',
        textAlign: 'right',
    },
    apptPrice: {
        fontSize: 13,
        color: '#10b981',
        fontWeight: '600',
        textAlign: 'right',
    },
    apptDuration: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'right',
    },
    apptNotes: {
        fontSize: 12,
        color: '#64748b',
        fontStyle: 'italic',
        textAlign: 'right',
    },
    statusBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    statusText: {
        fontSize: 11,
        color: '#10b981',
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        padding: 28,
        gap: 10,
    },
    emptyText: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1e293b',
        borderRadius: 20,
        padding: 18,
        width: '100%',
        maxHeight: '80%',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
    },
    modalHeader: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#f1f5f9',
        textAlign: 'right',
    },
    modalCloseButton: {
        padding: 4,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 10,
    },
    cancelModalButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    cancelModalButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#94a3b8',
    },
})
