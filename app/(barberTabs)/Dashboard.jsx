import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Calendar } from 'react-native-calendars'
import config from '../../config'
import apiClient from '../../lib/apiClient'
import SafeScreen from '../components/SafeScreen'

export default function Dashboard() {
    const [barberId, setBarberId] = useState('')
    const [loading, setLoading] = useState(false)
    const [appointmentsByDate, setAppointmentsByDate] = useState({})
    const [markedDates, setMarkedDates] = useState({})
    const [selectedDate, setSelectedDate] = useState('')
    const [showDayModal, setShowDayModal] = useState(false)

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const response = await apiClient.get(`${config.BASE_URL}/users/profile`)
                if (response.ok) {
                    const data = await response.json()
                    setBarberId(data.user._id)
                }
            } catch { }
        }
        loadProfile()
    }, [])

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

    return (
        <SafeScreen backgroundColor="#f8fafc">
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <MaterialCommunityIcons name="home" size={48} color="#3b82f6" />
                    <Text style={styles.title}>דשבורד הברבר</Text>
                    <Text style={styles.subtitle}>ברוך הבא למערכת ניהול הספר</Text>
                </View>

                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <MaterialCommunityIcons name="calendar-check" size={20} color="#10b981" />
                        <Text style={styles.statNumber}>{todaysAppointments.length}</Text>
                        <Text style={styles.statLabel}>תורים היום</Text>
                    </View>

                    <View style={styles.statCard}>
                        <MaterialCommunityIcons name="clock-outline" size={32} color="#f59e0b" />
                        <Text style={styles.statNumber}>3</Text>
                        <Text style={styles.statLabel}>ממתינים</Text>
                    </View>

                    <View style={styles.statCard}>
                        <MaterialCommunityIcons name="star" size={32} color="#8b5cf6" />
                        <Text style={styles.statNumber}>4.8</Text>
                        <Text style={styles.statLabel}>דירוג ממוצע</Text>
                    </View>
                </View>

                <View style={styles.quickActions}>
                    <Text style={styles.sectionTitle}>פעולות מהירות</Text>

                    <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(barberTabs)/Appointments')}>
                        <MaterialCommunityIcons name="calendar-plus" size={24} color="#3b82f6" />
                        <Text style={styles.actionText}>הוסף זמינות חדשה</Text>

                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => router.push('/(barberTabs)/Customers')}
                    >
                        <MaterialCommunityIcons name="account-multiple" size={24} color="#10b981" />
                        <Text style={styles.actionText}>צפה בלקוחות</Text>
                    </TouchableOpacity>

                    <View style={styles.actionCard}>
                        <MaterialCommunityIcons name="chart-line" size={24} color="#f59e0b" />
                        <Text style={styles.actionText}>דוחות וסטטיסטיקות</Text>
                    </View>
                </View>

                <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
                    <Text style={styles.sectionTitle}>לוח תספורות</Text>
                    {loading ? (
                        <View style={styles.loadingState}>
                            <ActivityIndicator size="large" color="#3b82f6" />
                            <Text style={styles.loadingText}>טוען נתונים...</Text>
                        </View>
                    ) : (
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
                                todayTextColor: '#2563eb',
                                arrowColor: '#111827'
                            }}
                            minDate={new Date(2000, 0, 1).toISOString().split('T')[0]}
                            maxDate={new Date(2100, 11, 31).toISOString().split('T')[0]}
                        />
                    )}
                </View>

                <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
                    <Text style={styles.sectionTitle}>תורים היום</Text>
                    {loading ? (
                        <View style={styles.loadingState}>
                            <ActivityIndicator size="small" color="#3b82f6" />
                            <Text style={styles.loadingText}>טוען תורים...</Text>
                        </View>
                    ) : todaysAppointments.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="calendar-remove" size={48} color="#9ca3af" />
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
                                                <MaterialCommunityIcons name="clock-outline" size={18} color="#2563eb" />
                                                <Text style={styles.apptTime}>{appt.startTime}</Text>
                                            </View>
                                            <View style={[styles.statusBadge, { backgroundColor: '#10b981' }]}>
                                                <Text style={styles.statusText}>מאושר</Text>
                                            </View>
                                        </View>
                                        <View style={styles.apptDetails}>
                                            <View style={styles.detailRow}>
                                                <MaterialCommunityIcons name="account" size={16} color="#6b7280" />
                                                <Text style={styles.apptCustomer}>
                                                    {appt.customer?.firstName} {appt.customer?.lastName}
                                                </Text>
                                            </View>
                                            <View style={styles.detailRow}>
                                                <MaterialCommunityIcons name="content-cut" size={16} color="#6b7280" />
                                                <Text style={styles.apptService}>{appt.service?.name || '—'}</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                        </ScrollView>
                    )}
                </View>
            </ScrollView>

            {/* רשימת התספורות של היום שנבחר */}
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
                                <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        {dayAppointments.length === 0 ? (
                            <View style={styles.emptyState}>
                                <MaterialCommunityIcons name="calendar-remove" size={48} color="#9ca3af" />
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
                                                    <MaterialCommunityIcons name="clock-outline" size={18} color="#2563eb" />
                                                    <Text style={styles.apptTime}>{appt.startTime}</Text>
                                                </View>
                                                <View style={[styles.statusBadge, { backgroundColor: '#10b981' }]}>
                                                    <Text style={styles.statusText}>מאושר</Text>
                                                </View>
                                            </View>

                                            <View style={styles.apptDetails}>
                                                <View style={styles.detailRow}>
                                                    <MaterialCommunityIcons name="account" size={16} color="#6b7280" />
                                                    <Text style={styles.apptCustomer}>
                                                        {appt.customer?.firstName} {appt.customer?.lastName}
                                                    </Text>
                                                </View>
                                                <View style={styles.detailRow}>
                                                    <MaterialCommunityIcons name="content-cut" size={16} color="#6b7280" />
                                                    <Text style={styles.apptService}>{appt.service?.name || '—'}</Text>
                                                </View>
                                                {!!appt.totalPrice && (
                                                    <View style={styles.detailRow}>
                                                        <MaterialCommunityIcons name="cash" size={16} color="#6b7280" />
                                                        <Text style={styles.apptPrice}>₪{appt.totalPrice}</Text>
                                                    </View>
                                                )}
                                                {!!appt.service?.durationMinutes && (
                                                    <View style={styles.detailRow}>
                                                        <MaterialCommunityIcons name="timer" size={16} color="#6b7280" />
                                                        <Text style={styles.apptDuration}>{appt.service?.durationMinutes} דקות</Text>
                                                    </View>
                                                )}
                                                {!!appt.notes && (
                                                    <View style={styles.detailRow}>
                                                        <MaterialCommunityIcons name="note-text" size={16} color="#6b7280" />
                                                        <Text style={styles.apptNotes}>{appt.notes}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    ))}
                            </ScrollView>
                        )}

                        <View style={styles.modalActions}>
                            <Pressable style={[styles.modalButton, styles.cancelModalButton]} onPress={() => setShowDayModal(false)}>
                                <Text style={styles.cancelModalButtonText}>סגור</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
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
        paddingVertical: 20,
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        marginBottom: 20,
        marginTop: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginTop: 16,
        marginBottom: 8
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center'
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 20,
        gap: 12
    },
    statCard: {
        flex: 1,
        backgroundColor: '#ffffff',
        padding: 10,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    statNumber: {
        fontSize: 20,
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
    quickActions: {
        paddingHorizontal: 16
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 16,
        textAlign: 'right'
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        gap: 12
    },
    actionText: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '500'
    },
    loadingState: {
        alignItems: 'center',
        padding: 24,
        gap: 12
    },
    loadingText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        width: '100%',
        maxHeight: '80%'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937'
    },
    modalCloseButton: {
        padding: 4
    },
    dayList: {
        maxHeight: 420
    },
    apptCard: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10
    },
    apptHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    apptDateTimeInfo: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 6
    },
    apptTime: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'right'
    },
    apptDetails: {
        gap: 6
    },
    detailRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8
    },
    apptCustomer: {
        fontSize: 15,
        color: '#111827',
        textAlign: 'right'
    },
    apptService: {
        fontSize: 14,
        color: '#374151',
        textAlign: 'right'
    },
    apptPrice: {
        fontSize: 14,
        color: '#10b981',
        fontWeight: '600',
        textAlign: 'right'
    },
    apptDuration: {
        fontSize: 13,
        color: '#6b7280',
        textAlign: 'right'
    },
    apptNotes: {
        fontSize: 13,
        color: '#6b7280',
        fontStyle: 'italic',
        textAlign: 'right'
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6
    },
    statusText: {
        fontSize: 12,
        color: '#ffffff',
        fontWeight: '500'
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8
    },
    modalButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8
    },
    cancelModalButton: {
        backgroundColor: '#f3f4f6'
    },
    cancelModalButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b7280'
    },
    emptyState: {
        alignItems: 'center',
        padding: 24,
        gap: 8
    },
    emptyText: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center'
    }
})