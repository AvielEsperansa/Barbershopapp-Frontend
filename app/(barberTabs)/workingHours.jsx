import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View
} from 'react-native'
import config from '../../config'
import apiClient from '../../lib/apiClient'
import SafeScreen from '../components/SafeScreen'

const DAYS_OF_WEEK = [
    { key: 0, name: 'ראשון', shortName: 'א' },
    { key: 1, name: 'שני', shortName: 'ב' },
    { key: 2, name: 'שלישי', shortName: 'ג' },
    { key: 3, name: 'רביעי', shortName: 'ד' },
    { key: 4, name: 'חמישי', shortName: 'ה' },
    { key: 5, name: 'שישי', shortName: 'ו' },
    { key: 6, name: 'שבת', shortName: 'ש' }
]

export default function WorkingHours() {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [workingHours, setWorkingHours] = useState([])
    const [barberId, setBarberId] = useState('')

    useEffect(() => {
        loadBarberProfile()
        loadWorkingHours()
    }, [])

    const loadBarberProfile = async () => {
        try {
            const response = await apiClient.get(`${config.BASE_URL}/users/profile`)
            if (response.ok) {
                const data = await response.json()
                setBarberId(data.user._id)
            }
        } catch (error) {
            console.error('Error loading barber profile:', error)
        }
    }

    const loadWorkingHours = async () => {
        try {
            setLoading(true)
            setError('')

            const response = await apiClient.get(`${config.BASE_URL}/barbers/${barberId}`)

            if (response.ok) {
                const data = await response.json()
                setWorkingHours(data.workingHours || [])
            } else {
                // אם אין עדיין ימי עבודה, ניצור ברירת מחדל
                const defaultWorkingHours = DAYS_OF_WEEK.map(day => ({
                    dayOfWeek: day.key,
                    startTime: '09:00',
                    endTime: '18:00',
                    isWorking: day.key !== 6, // לא עובד בשבת
                    breakStartTime: '13:00',
                    breakEndTime: '14:00'
                }))
                setWorkingHours(defaultWorkingHours)
            }
        } catch (error) {
            console.error('Error loading working hours:', error)
            setError('שגיאה בטעינת ימי העבודה')
        } finally {
            setLoading(false)
        }
    }

    const updateWorkingHours = async () => {
        if (!barberId) {
            Alert.alert('שגיאה', 'לא נמצא מזהה ספר')
            return
        }

        try {
            setSaving(true)
            setError('')

            const response = await apiClient.post(`${config.BASE_URL}/working-hours/barber/${barberId}`, {
                workingHours: workingHours
            })

            if (response.ok) {
                Alert.alert('הצלחה', 'ימי העבודה עודכנו בהצלחה')
                router.back()
            } else {
                const errorData = await response.json()
                throw new Error(errorData.error || 'שגיאה בעדכון ימי העבודה')
            }
        } catch (error) {
            console.error('Error updating working hours:', error)
            setError(error.message || 'שגיאה בעדכון ימי העבודה')
        } finally {
            setSaving(false)
        }
    }

    const updateDay = (dayKey, field, value) => {
        setWorkingHours(prev =>
            prev.map(day =>
                day.dayOfWeek === dayKey
                    ? { ...day, [field]: value }
                    : day
            )
        )
    }

    const toggleWorkingDay = (dayKey) => {
        setWorkingHours(prev =>
            prev.map(day =>
                day.dayOfWeek === dayKey
                    ? { ...day, isWorking: !day.isWorking }
                    : day
            )
        )
    }

    const formatTime = (time) => {
        if (!time) return ''
        return time.substring(0, 5) // להסיר שניות אם יש
    }

    if (loading) {
        return (
            <SafeScreen paddingTop={5}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={styles.loadingText}>טוען ימי עבודה...</Text>
                </View>
            </SafeScreen>
        )
    }

    return (
        <SafeScreen paddingTop={5}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-right" size={24} color="#111827" />
                        <Text style={styles.backText}>חזרה</Text>
                    </Pressable>
                    <Text style={styles.title}>ימי עבודה</Text>
                </View>

                {!!error && (
                    <View style={styles.errorContainer}>
                        <MaterialCommunityIcons name="alert-circle" size={20} color="#ef4444" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {/* Working Hours List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>הגדרת שעות עבודה</Text>

                    {DAYS_OF_WEEK.map(day => {
                        const dayData = workingHours.find(wh => wh.dayOfWeek === day.key) || {
                            dayOfWeek: day.key,
                            startTime: '09:00',
                            endTime: '18:00',
                            isWorking: day.key !== 6,
                            breakStartTime: '13:00',
                            breakEndTime: '14:00'
                        }

                        return (
                            <View key={day.key} style={styles.dayCard}>
                                <View style={styles.dayHeader}>
                                    <View style={styles.dayInfo}>
                                        <Text style={styles.dayName}>{day.name}</Text>
                                        <Text style={styles.dayShortName}>{day.shortName}</Text>
                                    </View>
                                    <Switch
                                        value={dayData.isWorking}
                                        onValueChange={() => toggleWorkingDay(day.key)}
                                        trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
                                        thumbColor={dayData.isWorking ? '#ffffff' : '#f3f4f6'}
                                    />
                                </View>

                                {dayData.isWorking && (
                                    <View style={styles.timeInputs}>
                                        <View style={styles.timeRow}>
                                            <Text style={styles.timeLabel}>התחלה:</Text>
                                            <TextInput
                                                style={styles.timeInput}
                                                value={formatTime(dayData.startTime)}
                                                onChangeText={(text) => updateDay(day.key, 'startTime', text)}
                                                placeholder="09:00"
                                                keyboardType="numeric"
                                                maxLength={5}
                                            />
                                        </View>

                                        <View style={styles.timeRow}>
                                            <Text style={styles.timeLabel}>סיום:</Text>
                                            <TextInput
                                                style={styles.timeInput}
                                                value={formatTime(dayData.endTime)}
                                                onChangeText={(text) => updateDay(day.key, 'endTime', text)}
                                                placeholder="18:00"
                                                keyboardType="numeric"
                                                maxLength={5}
                                            />
                                        </View>

                                        <View style={styles.breakSection}>
                                            <Text style={styles.breakTitle}>הפסקה:</Text>
                                            <View style={styles.timeRow}>
                                                <Text style={styles.timeLabel}>התחלה:</Text>
                                                <TextInput
                                                    style={styles.timeInput}
                                                    value={formatTime(dayData.breakStartTime)}
                                                    onChangeText={(text) => updateDay(day.key, 'breakStartTime', text)}
                                                    placeholder="13:00"
                                                    keyboardType="numeric"
                                                    maxLength={5}
                                                />
                                            </View>
                                            <View style={styles.timeRow}>
                                                <Text style={styles.timeLabel}>סיום:</Text>
                                                <TextInput
                                                    style={styles.timeInput}
                                                    value={formatTime(dayData.breakEndTime)}
                                                    onChangeText={(text) => updateDay(day.key, 'breakEndTime', text)}
                                                    placeholder="14:00"
                                                    keyboardType="numeric"
                                                    maxLength={5}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </View>
                        )
                    })}
                </View>

                {/* Save Button */}
                <Pressable
                    disabled={saving}
                    onPress={updateWorkingHours}
                    style={[styles.saveButton, saving && { opacity: 0.7 }]}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                        <Text style={styles.saveButtonText}>שמירת ימי עבודה</Text>
                    )}
                </Pressable>
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
        color: '#ef4444',
        fontSize: 14
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
    dayCard: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        gap: 12
    },
    dayHeader: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    dayInfo: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8
    },
    dayName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827'
    },
    dayShortName: {
        fontSize: 14,
        color: '#6b7280',
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4
    },
    timeInputs: {
        gap: 12
    },
    timeRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 12
    },
    timeLabel: {
        fontSize: 14,
        color: '#6b7280',
        minWidth: 60,
        textAlign: 'right'
    },
    timeInput: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        textAlign: 'center',
        minWidth: 80
    },
    breakSection: {
        backgroundColor: '#f9fafb',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        gap: 8
    },
    breakTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        textAlign: 'right',
        marginBottom: 4
    },
    saveButton: {
        backgroundColor: '#3b82f6',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16
    },
    saveButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16
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
    }
})
