import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import config from '../config'
import apiClient from '../lib/apiClient'
import SafeScreen from './components/SafeScreen'

export default function MyAppointments() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [appointments, setAppointments] = useState([])

    const load = useCallback(async () => {
        setLoading(true)
        setError('')

        try {
            // קבלת התורים מהשרת
            const response = await apiClient.get(`${config.BASE_URL}/appointments/`)
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data?.error || 'שגיאה בטעינת התורים')
            }

            // קבלת רשימת התורים
            const allAppointments = data.appointments || []

            // סינון תורים עתידיים בלבד
            const today = new Date()
            today.setHours(0, 0, 0, 0) // התחלת היום

            // הוספת תאריך מפורש לכל תור וסינון תורים עתידיים
            const appointmentsWithDate = allAppointments.map(appointment => ({
                ...appointment,
                appointmentDate: new Date(appointment.date || appointment.startDate || appointment.startTime)
            })).filter(appointment => appointment.appointmentDate >= today)

            // מיון לפי תאריך (הכי קרוב קודם)
            appointmentsWithDate.sort((a, b) => a.appointmentDate - b.appointmentDate)

            const futureAppointments = appointmentsWithDate

            setAppointments(futureAppointments)

        } catch (error) {
            setError(error.message || 'שגיאה בטעינת התורים')
            console.error('Error loading appointments:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])
    useFocusEffect(useCallback(() => { load() }, [load]))

    const onCancelAppointment = async (appointment) => {
        const appt = appointment
        if (!appt) return
        const apptId = appt._id || appt.id
        if (!apptId) {
            Alert.alert('שגיאה', 'לא נמצא מזהה תור לביטול')
            return
        }
        Alert.alert(
            'ביטול תור',
            'האם לבטל את התור?',
            [
                { text: 'לא', style: 'cancel' },
                {
                    text: 'כן', style: 'destructive', onPress: async () => {
                        try {
                            setLoading(true)
                            const url = `${config.BASE_URL}/appointments/${apptId}`
                            const res = await apiClient.delete(url)
                            const json = await res.json().catch(() => ({}))
                            if (!res.ok) {
                                Alert.alert('שגיאה', json?.error || 'נכשל לבטל את התור')
                            } else {
                                Alert.alert('התור בוטל')

                                // Optimistic UI: remove from list
                                setAppointments((prev) => (prev || []).filter((x) => (x._id || x.id) !== apptId))
                                await load()
                            }
                        } finally {
                            setLoading(false)
                        }
                    }
                }
            ]
        )
    }

    const Row = ({ label, value }) => (
        <View style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{value}</Text>
        </View>
    )

    return (
        <SafeScreen backgroundColor="#09090b">
            <ScrollView style={{ backgroundColor: "#09090b" }} contentContainerStyle={styles.container}>
                {/* Glowing Red Background Orbs */}
                <View style={styles.orbTopRight} />
                <View style={styles.orbBottomLeft} />

                <View style={styles.header}>
                    <MaterialCommunityIcons name="calendar-clock" size={24} color="#ef4444" />
                    <Text style={styles.title}>התורים שלי</Text>
                </View>

                {loading && (
                    <View style={styles.loading}>
                        <ActivityIndicator size="large" color="#ef4444" />
                    </View>
                )}

                {!!error && <Text style={styles.error}>{error}</Text>}

                {!loading && appointments.length === 0 && (
                    <Text style={styles.empty}>אין תורים קרובים להצגה</Text>
                )}

                {appointments.map((appt) => (
                    <View key={appt._id || appt.id} style={styles.card}>
                        <Row label="תאריך:" value={(() => { const d = new Date(appt.date || appt.startDate || appt.startTime); return isNaN(d) ? '-' : d.toLocaleDateString('he-IL') })()} />
                        <Row label="שעה:" value={appt.startTime || (appt.time && appt.time.start) || '-'} />
                        {!!appt.endTime && (
                            <Row label="סיום:" value={appt.endTime} />
                        )}
                        {!!(appt.service?.name || appt.serviceName) && (
                            <Row label="טיפול:" value={appt.service?.name || appt.serviceName} />
                        )}
                        {!!appt.service?.durationMinutes && (
                            <Row label="משך:" value={`${appt.service.durationMinutes} דקות`} />
                        )}
                        {!!(appt.barber?.firstName || appt.barberName) && (
                            <Row label="ספר:" value={appt.barber?.firstName ? `${appt.barber.firstName} ${appt.barber.lastName || ''}`.trim() : appt.barberName} />
                        )}
                        <Pressable style={styles.cancelButton} onPress={() => onCancelAppointment(appt)}>
                            <Text style={styles.cancelButtonText}>ביטול תור</Text>
                        </Pressable>
                    </View>
                ))}
            </ScrollView>
        </SafeScreen>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        gap: 12,
        backgroundColor: '#09090b'
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
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ffffff'
    },
    card: {
        backgroundColor: 'rgba(24, 24, 27, 0.85)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)',
        borderRadius: 16,
        padding: 14,
        gap: 8
    },
    row: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between'
    },
    rowLabel: { color: '#a1a1aa' },
    rowValue: { color: '#ffffff', fontWeight: '600' },
    error: { color: '#ef4444', textAlign: 'center' },
    empty: { color: '#a1a1aa', textAlign: 'center', marginTop: 12 },
    loading: { alignItems: 'center', paddingVertical: 20 },
    cancelButton: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderColor: 'rgba(239, 68, 68, 0.3)',
        borderWidth: 1,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignSelf: 'flex-end',
        marginTop: 8
    },
    cancelButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center'
    }
})


