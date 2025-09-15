import { MaterialCommunityIcons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useFocusEffect } from '@react-navigation/native'
import { router } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View
} from 'react-native'
import config from '../../config'
import apiClient from '../../lib/apiClient'
import SafeScreen from '../components/SafeScreen'

export default function Appointments() {
    const [activeTab, setActiveTab] = useState('appointments')
    const [barberId, setBarberId] = useState('')

    // Working Hours State
    const [workingHours, setWorkingHours] = useState({})
    const [workingHoursLoading, setWorkingHoursLoading] = useState(false)

    // Day Offs State
    const [dayOffs, setDayOffs] = useState([])
    const [dayOffsLoading, setDayOffsLoading] = useState(false)

    // Time Picker State
    const [showTimePicker, setShowTimePicker] = useState(false)
    const [timePickerType, setTimePickerType] = useState('') // 'start' or 'end'
    const [timePickerDay, setTimePickerDay] = useState(0)

    useEffect(() => {
        if (barberId) {
            loadWorkingHours()
            loadDayOffs()
        }
    }, [barberId, loadWorkingHours, loadDayOffs])

    useFocusEffect(
        React.useCallback(() => {
            if (barberId) {
                loadWorkingHours()
                loadDayOffs()
            }
        }, [barberId, loadWorkingHours, loadDayOffs])
    )

    // טוען את הפרופיל של הספר בהתחלה
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const response = await apiClient.get(`${config.BASE_URL}/users/profile`)
                if (response.ok) {
                    const data = await response.json()
                    setBarberId(data.user._id)
                }
            } catch (error) {
                console.error('Error loading profile:', error)
            }
        }
        loadProfile()
    }, [])

    const loadWorkingHours = useCallback(async () => {
        try {
            setWorkingHoursLoading(true)
            const response = await apiClient.get(`${config.BASE_URL}/barbers/${barberId}/working-hours`)

            if (response.ok) {
                const data = await response.json()
                const hoursMap = {}
                data.workingHours.forEach(wh => {
                    hoursMap[wh.dayOfWeek] = wh
                })
                setWorkingHours(hoursMap)
            } else {
                // אם אין שעות עבודה, יצירת ברירת מחדל
                const defaultHours = {
                    0: { dayOfWeek: 0, isWorking: false, startTime: '09:00', endTime: '17:00', breakStartTime: '12:00', breakEndTime: '13:00' },
                    1: { dayOfWeek: 1, isWorking: true, startTime: '09:00', endTime: '17:00', breakStartTime: '12:00', breakEndTime: '13:00' },
                    2: { dayOfWeek: 2, isWorking: true, startTime: '09:00', endTime: '17:00', breakStartTime: '12:00', breakEndTime: '13:00' },
                    3: { dayOfWeek: 3, isWorking: true, startTime: '09:00', endTime: '17:00', breakStartTime: '12:00', breakEndTime: '13:00' },
                    4: { dayOfWeek: 4, isWorking: true, startTime: '09:00', endTime: '17:00', breakStartTime: '12:00', breakEndTime: '13:00' },
                    5: { dayOfWeek: 5, isWorking: true, startTime: '09:00', endTime: '17:00', breakStartTime: '12:00', breakEndTime: '13:00' },
                    6: { dayOfWeek: 6, isWorking: false, startTime: '09:00', endTime: '17:00', breakStartTime: '12:00', breakEndTime: '13:00' }
                }
                setWorkingHours(defaultHours)
            }
        } catch (error) {
            console.error('Error loading working hours:', error)
        } finally {
            setWorkingHoursLoading(false)
        }
    }, [barberId])

    const loadDayOffs = useCallback(async () => {
        try {
            setDayOffsLoading(true)
            const response = await apiClient.get(`${config.BASE_URL}/day-off`)

            if (response.ok) {
                const data = await response.json()
                setDayOffs(data.daysOff || [])
            }
        } catch (error) {
            console.error('Error loading day offs:', error)
        } finally {
            setDayOffsLoading(false)
        }
    }, [])

    const updateWorkingHours = async (dayOfWeek, field, value) => {
        const updatedHours = { ...workingHours }
        if (!updatedHours[dayOfWeek]) {
            updatedHours[dayOfWeek] = { dayOfWeek, isWorking: false, startTime: '09:00', endTime: '17:00', breakStartTime: '12:00', breakEndTime: '13:00' }
        }
        updatedHours[dayOfWeek][field] = value
        setWorkingHours(updatedHours)
    }

    const saveWorkingHours = async () => {
        try {
            const workingHoursArray = Object.values(workingHours)
            const response = await apiClient.post(`${config.BASE_URL}/working-hours/barber/${barberId}`, {
                workingHours: workingHoursArray
            })

            if (response.ok) {
                Alert.alert('הצלחה', 'שעות העבודה נשמרו בהצלחה')
            } else {
                throw new Error('שגיאה בשמירת שעות העבודה')
            }
        } catch (error) {
            console.error('Error saving working hours:', error)
            Alert.alert('שגיאה', error.message || 'שגיאה בשמירת שעות העבודה')
        }
    }

    const deleteDayOff = async (dayOffId) => {
        Alert.alert(
            'מחיקת יום חופש',
            'האם אתה בטוח שברצונך למחוק את יום החופש?',
            [
                { text: 'ביטול', style: 'cancel' },
                {
                    text: 'מחק',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await apiClient.delete(`${config.BASE_URL}/day-off/${dayOffId}`)

                            if (response.ok) {
                                Alert.alert('הצלחה', 'יום החופש נמחק בהצלחה')
                                loadDayOffs()
                            } else {
                                const errorData = await response.json()
                                throw new Error(errorData.error || 'שגיאה במחיקת יום החופש')
                            }
                        } catch (error) {
                            console.error('Error deleting day off:', error)
                            Alert.alert('שגיאה', error.message || 'שגיאה במחיקת יום החופש')
                        }
                    }
                }
            ]
        )
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const formatTime = (time) => {
        if (!time) return ''
        return time.substring(0, 5)
    }

    const getDayName = (dayOfWeek) => {
        const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
        return days[dayOfWeek]
    }

    const openTimePicker = (dayOfWeek, type) => {
        setTimePickerDay(dayOfWeek)
        setTimePickerType(type)
        setShowTimePicker(true)
    }

    const onTimeChange = (event, selectedTime) => {
        setShowTimePicker(false)
        if (selectedTime) {
            const timeString = selectedTime.toTimeString().substring(0, 5)
            updateWorkingHours(timePickerDay, timePickerType, timeString)
        }
    }

    const getTimeFromString = (timeString) => {
        if (!timeString) return new Date()
        const [hours, minutes] = timeString.split(':')
        const date = new Date()
        date.setHours(parseInt(hours), parseInt(minutes), 0, 0)
        return date
    }

    return (
        <SafeScreen paddingTop={5} backgroundColor="#f8fafc">
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <MaterialCommunityIcons name="calendar-clock" size={48} color="#3b82f6" />
                    <Text style={styles.title}>ניהול תורים</Text>
                    <Text style={styles.subtitle}>נהל את לוח העבודה והתורים שלך</Text>
                </View>

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    <Pressable
                        style={[styles.tab, activeTab === 'appointments' && styles.activeTab]}
                        onPress={() => setActiveTab('appointments')}
                    >
                        <Text style={[styles.tabText, activeTab === 'appointments' && styles.activeTabText]}>
                            תורים
                        </Text>
                        <MaterialCommunityIcons
                            name="calendar"
                            size={20}
                            color={activeTab === 'appointments' ? '#3b82f6' : '#6b7280'}
                        />
                    </Pressable>

                    <Pressable
                        style={[styles.tab, activeTab === 'workingHours' && styles.activeTab]}
                        onPress={() => setActiveTab('workingHours')}
                    >
                        <Text style={[styles.tabText, activeTab === 'workingHours' && styles.activeTabText]}>
                            שעות עבודה
                        </Text>
                        <MaterialCommunityIcons
                            name="clock-outline"
                            size={20}
                            color={activeTab === 'workingHours' ? '#3b82f6' : '#6b7280'}
                        />
                    </Pressable>

                    <Pressable
                        style={[styles.tab, activeTab === 'dayOffs' && styles.activeTab]}
                        onPress={() => setActiveTab('dayOffs')}
                    >
                        <Text style={[styles.tabText, activeTab === 'dayOffs' && styles.activeTabText]}>
                            ימי חופש
                        </Text>
                        <MaterialCommunityIcons
                            name="calendar-remove"
                            size={20}
                            color={activeTab === 'dayOffs' ? '#3b82f6' : '#6b7280'}
                        />
                    </Pressable>
                </View>

                {/* Content */}
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {activeTab === 'appointments' && (
                        <View style={styles.tabContent}>
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>תורים היום</Text>
                                <View style={styles.emptyState}>
                                    <MaterialCommunityIcons name="calendar-check" size={48} color="#9ca3af" />
                                    <Text style={styles.emptyText}>אין תורים היום</Text>
                                    <Text style={styles.emptySubtext}>התורים יופיעו כאן כשהלקוחות יקבעו תורים</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {activeTab === 'workingHours' && (
                        <View style={styles.tabContent}>
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>שעות עבודה שבועיות</Text>

                                {workingHoursLoading ? (
                                    <View style={styles.loadingState}>
                                        <ActivityIndicator size="large" color="#3b82f6" />
                                        <Text style={styles.loadingText}>טוען שעות עבודה...</Text>
                                    </View>
                                ) : (
                                    <>
                                        {[0, 1, 2, 3, 4, 5, 6].map(dayOfWeek => {
                                            const day = workingHours[dayOfWeek] || { dayOfWeek, isWorking: false, startTime: '09:00', endTime: '17:00', breakStartTime: '12:00', breakEndTime: '13:00' }

                                            return (
                                                <View key={dayOfWeek} style={styles.dayCard}>
                                                    <View style={styles.dayHeader}>
                                                        <View style={styles.dayInfo}>
                                                            <Text style={styles.dayName}>{getDayName(dayOfWeek)}</Text>
                                                            <Switch
                                                                value={day.isWorking}
                                                                onValueChange={(value) => updateWorkingHours(dayOfWeek, 'isWorking', value)}
                                                                trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
                                                                thumbColor={day.isWorking ? '#ffffff' : '#f3f4f6'}
                                                            />
                                                        </View>
                                                    </View>

                                                    {day.isWorking && (
                                                        <View style={styles.timeInputs}>
                                                            <View style={styles.timeRow}>
                                                                <Text style={styles.timeLabel}>שעת התחלה:</Text>
                                                                <Pressable
                                                                    style={styles.timeButton}
                                                                    onPress={() => openTimePicker(dayOfWeek, 'startTime')}
                                                                >
                                                                    <Text style={styles.timeButtonText}>{day.startTime}</Text>
                                                                    <MaterialCommunityIcons name="clock-outline" size={16} color="#6b7280" />
                                                                </Pressable>
                                                            </View>
                                                            <View style={styles.timeRow}>
                                                                <Text style={styles.timeLabel}>שעת סיום:</Text>
                                                                <Pressable
                                                                    style={styles.timeButton}
                                                                    onPress={() => openTimePicker(dayOfWeek, 'endTime')}
                                                                >
                                                                    <Text style={styles.timeButtonText}>{day.endTime}</Text>
                                                                    <MaterialCommunityIcons name="clock-outline" size={16} color="#6b7280" />
                                                                </Pressable>
                                                            </View>
                                                            <View style={styles.timeRow}>
                                                                <Text style={styles.timeLabel}>הפסקה מ:</Text>
                                                                <Pressable
                                                                    style={styles.timeButton}
                                                                    onPress={() => openTimePicker(dayOfWeek, 'breakStartTime')}
                                                                >
                                                                    <Text style={styles.timeButtonText}>{day.breakStartTime}</Text>
                                                                    <MaterialCommunityIcons name="clock-outline" size={16} color="#6b7280" />
                                                                </Pressable>
                                                            </View>
                                                            <View style={styles.timeRow}>
                                                                <Text style={styles.timeLabel}>הפסקה עד:</Text>
                                                                <Pressable
                                                                    style={styles.timeButton}
                                                                    onPress={() => openTimePicker(dayOfWeek, 'breakEndTime')}
                                                                >
                                                                    <Text style={styles.timeButtonText}>{day.breakEndTime}</Text>
                                                                    <MaterialCommunityIcons name="clock-outline" size={16} color="#6b7280" />
                                                                </Pressable>
                                                            </View>
                                                        </View>
                                                    )}
                                                </View>
                                            )
                                        })}

                                        <Pressable style={styles.saveButton} onPress={saveWorkingHours}>
                                            <MaterialCommunityIcons name="content-save" size={20} color="#ffffff" />
                                            <Text style={styles.saveButtonText}>שמור שעות עבודה</Text>
                                        </Pressable>
                                    </>
                                )}
                            </View>
                        </View>
                    )}

                    {activeTab === 'dayOffs' && (
                        <View style={styles.tabContent}>
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>ימי חופש</Text>
                                    <Pressable
                                        style={styles.addButton}
                                        onPress={() => router.push('/(barberTabs)/addDayOff')}
                                    >
                                        <MaterialCommunityIcons name="plus" size={16} color="#ffffff" />
                                        <Text style={styles.addButtonText}>הוסף</Text>
                                    </Pressable>
                                </View>

                                {dayOffsLoading ? (
                                    <View style={styles.loadingState}>
                                        <ActivityIndicator size="large" color="#3b82f6" />
                                        <Text style={styles.loadingText}>טוען ימי חופש...</Text>
                                    </View>
                                ) : dayOffs.length === 0 ? (
                                    <View style={styles.emptyState}>
                                        <MaterialCommunityIcons name="calendar-remove" size={48} color="#9ca3af" />
                                        <Text style={styles.emptyText}>אין ימי חופש מוגדרים</Text>
                                        <Text style={styles.emptySubtext}>לחץ על &quot;הוסף&quot; כדי להוסיף יום חופש</Text>
                                    </View>
                                ) : (
                                    dayOffs.map((dayOff) => (
                                        <View key={dayOff._id} style={styles.dayOffCard}>
                                            <View style={styles.dayOffHeader}>
                                                <View style={styles.dayOffInfo}>
                                                    <MaterialCommunityIcons name="calendar" size={20} color="#6b7280" />
                                                    <Text style={styles.dayOffDate}>{formatDate(dayOff.date)}</Text>
                                                </View>
                                                <View style={styles.dayOffType}>
                                                    <Text style={styles.dayOffTypeText}>
                                                        {dayOff.isFullDay ? 'יום מלא' : 'חלקי'}
                                                    </Text>
                                                </View>
                                            </View>

                                            <View style={styles.dayOffDetails}>
                                                <View style={styles.detailRow}>
                                                    <MaterialCommunityIcons name="note-text" size={16} color="#6b7280" />
                                                    <Text style={styles.detailText}>
                                                        {dayOff.reason || 'לא צוינה סיבה'}
                                                    </Text>
                                                </View>

                                                {!dayOff.isFullDay && (
                                                    <View style={styles.detailRow}>
                                                        <MaterialCommunityIcons name="clock" size={16} color="#6b7280" />
                                                        <Text style={styles.detailText}>
                                                            {formatTime(dayOff.startTime)} - {formatTime(dayOff.endTime)}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>

                                            <View style={styles.dayOffActions}>
                                                <Pressable
                                                    style={styles.deleteButton}
                                                    onPress={() => deleteDayOff(dayOff._id)}
                                                >
                                                    <MaterialCommunityIcons name="delete" size={16} color="#ef4444" />
                                                    <Text style={styles.deleteButtonText}>מחק</Text>
                                                </Pressable>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </View>
                        </View>
                    )}
                </ScrollView>
            </View>

            {/* Time Picker */}
            {showTimePicker && (
                <View style={styles.timePickerContainer}>
                    <View style={styles.timePickerHeader}>
                        <Text style={styles.timePickerTitle}>
                            בחר {timePickerType === 'startTime' ? 'שעת התחלה' :
                                timePickerType === 'endTime' ? 'שעת סיום' :
                                    timePickerType === 'breakStartTime' ? 'שעת הפסקה' : 'שעת סיום הפסקה'}
                        </Text>
                        <Pressable
                            style={styles.closeButton}
                            onPress={() => setShowTimePicker(false)}
                        >
                            <MaterialCommunityIcons name="close" size={20} color="#6b7280" />
                        </Pressable>
                    </View>
                    <DateTimePicker
                        value={getTimeFromString(workingHours[timePickerDay]?.[timePickerType] || '09:00')}
                        mode="time"
                        display="spinner"
                        onChange={onTimeChange}
                        style={styles.timePicker}
                    />
                </View>
            )}
        </SafeScreen>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc'
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
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        overflow: 'hidden'
    },
    tab: {
        flex: 1,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        paddingHorizontal: 8
    },
    activeTab: {
        backgroundColor: '#eff6ff',
        borderBottomWidth: 2,
        borderBottomColor: '#3b82f6'
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280',
        textAlign: 'right'
    },
    activeTabText: {
        color: '#3b82f6',
        fontWeight: '600',
        textAlign: 'right'
    },
    content: {
        flex: 1,
        paddingHorizontal: 16
    },
    tabContent: {
        flex: 1
    },
    section: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        overflow: 'hidden'
    },
    sectionHeader: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 8
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        padding: 16,
        paddingBottom: 8,
        textAlign: 'right'
    },
    addButton: {
        backgroundColor: '#3b82f6',
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8
    },
    addButtonText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'right'
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        gap: 12
    },
    emptyText: {
        fontSize: 18,
        color: '#6b7280',
        textAlign: 'right'
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'right'
    },
    loadingState: {
        alignItems: 'center',
        padding: 40,
        gap: 12
    },
    loadingText: {
        fontSize: 16,
        color: '#6b7280',
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
        gap: 12
    },
    dayName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        textAlign: 'right'
    },
    timeInputs: {
        gap: 8
    },
    timeRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    timeLabel: {
        fontSize: 14,
        color: '#6b7280',
        flex: 1,
        textAlign: 'right'
    },
    timeInput: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        color: '#111827',
        textAlign: 'center',
        width: 80
    },
    timeButton: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#f9fafb',
        minWidth: 80
    },
    timeButtonText: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '500'
    },
    saveButton: {
        backgroundColor: '#10b981',
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        margin: 16,
        borderRadius: 12
    },
    saveButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16,
        textAlign: 'right'
    },
    dayOffCard: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        gap: 12
    },
    dayOffHeader: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    dayOffInfo: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8
    },
    dayOffDate: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        textAlign: 'right'
    },
    dayOffType: {
        backgroundColor: '#eff6ff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12
    },
    dayOffTypeText: {
        fontSize: 12,
        color: '#3b82f6',
        fontWeight: '500',
        textAlign: 'right'
    },
    dayOffDetails: {
        gap: 8
    },
    detailRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8
    },
    detailText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'right'
    },
    dayOffActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end'
    },
    deleteButton: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca'
    },
    deleteButtonText: {
        fontSize: 12,
        color: '#ef4444',
        fontWeight: '500',
        textAlign: 'right'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc'
    },
    timePickerContainer: {
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingVertical: 16,
        alignItems: 'center',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000
    },
    timePickerHeader: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        width: '100%'
    },
    timePickerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        textAlign: 'right'
    },
    closeButton: {
        padding: 8
    },
    timePicker: {
        width: 200,
        height: 200
    }
})
