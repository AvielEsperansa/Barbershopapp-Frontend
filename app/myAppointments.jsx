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
            const res = await apiClient.get(`${config.BASE_URL}/appointments/`)
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error || 'Failed to load appointments')
            const list = json.appointments || json.data || (Array.isArray(json) ? json : [])
            const todayKey = new Date().toISOString().split('T')[0]
            const isCanceled = (a) => {
                const st = (a.status || a.state || '').toString().toLowerCase()
                return st === 'canceled' || st === 'cancelled' || a.isCanceled || a.isCancelled || !!a.canceledAt || !!a.cancelledAt
            }
            const toDayKey = (a) => {
                const dateStr = a.date || a.startDate || a.start
                if (!dateStr) return null
                const d = new Date(dateStr)
                if (Number.isNaN(d.getTime())) return null
                return d.toISOString().split('T')[0]
            }
            const upcoming = (Array.isArray(list) ? list : [])
                .filter((a) => !isCanceled(a))
                .map((a) => ({ a, dayKey: toDayKey(a) }))
                .filter(({ dayKey }) => !!dayKey && dayKey >= todayKey) // תורים עתידיים
                .sort((x, y) => (x.dayKey < y.dayKey ? -1 : x.dayKey > y.dayKey ? 1 : 0)) // מיון עולה (הכי קרוב קודם)
                .map(({ a }) => a)
            setAppointments(upcoming)
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load appointments')
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
                            const url = `${config.BASE_URL}/appointments/cancel/${apptId}`
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
        <SafeScreen paddingTop={5}>
            <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 24 }]}>
                <View style={styles.header}>
                    <MaterialCommunityIcons name="calendar" size={22} color="#111827" />
                    <Text style={styles.title}>התורים הקרובים שלי</Text>
                </View>

                {!!error && <Text style={styles.error}>{error}</Text>}
                {loading && (
                    <View style={styles.loading}><ActivityIndicator size="large" color="#3b82f6" /></View>
                )}

                {appointments.length === 0 && !loading && (
                    <Text style={styles.empty}>אין תורים להצגה</Text>
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
        backgroundColor: '#f8fafc'
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
        color: '#111827'
    },
    card: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 12,
        gap: 6
    },
    row: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between'
    },
    rowLabel: { color: '#6b7280' },
    rowValue: { color: '#111827', fontWeight: '600' },
    error: { color: '#b91c1c', textAlign: 'center' },
    empty: { color: '#6b7280', textAlign: 'center', marginTop: 12 },
    loading: { alignItems: 'center', paddingVertical: 20 },
    cancelButton: {
        backgroundColor: '#b91c1c',
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


