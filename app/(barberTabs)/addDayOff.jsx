import { MaterialCommunityIcons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { router } from 'expo-router'
import React, { useState } from 'react'
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

export default function AddDayOff() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [date, setDate] = useState(new Date())
    const [reason, setReason] = useState('')
    const [isFullDay, setIsFullDay] = useState(true)
    const [startTime, setStartTime] = useState('09:00')
    const [endTime, setEndTime] = useState('18:00')
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [showTimePicker, setShowTimePicker] = useState(false)
    const [timePickerType, setTimePickerType] = useState('') // 'start' or 'end'

    const formatDate = (date) => {
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

    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(false)
        if (selectedDate) {
            setDate(selectedDate)
        }
    }

    const openTimePicker = (type) => {
        setTimePickerType(type)
        setShowTimePicker(true)
    }

    const onTimeChange = (event, selectedTime) => {
        setShowTimePicker(false)
        if (selectedTime) {
            const timeString = selectedTime.toTimeString().substring(0, 5)
            if (timePickerType === 'start') {
                setStartTime(timeString)
            } else {
                setEndTime(timeString)
            }
        }
    }

    const getTimeFromString = (timeString) => {
        if (!timeString) return new Date()
        const [hours, minutes] = timeString.split(':')
        const date = new Date()
        date.setHours(parseInt(hours), parseInt(minutes), 0, 0)
        return date
    }

    const addDayOff = async () => {
        if (!reason.trim()) {
            Alert.alert('שגיאה', 'יש להזין סיבה ליום החופש')
            return
        }

        if (!isFullDay && (!startTime || !endTime)) {
            Alert.alert('שגיאה', 'יש להזין שעות התחלה וסיום ליום החופש החלקי')
            return
        }

        // בדיקה שהתאריך לא בעבר
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const selectedDate = new Date(date)
        selectedDate.setHours(0, 0, 0, 0)

        if (selectedDate < today) {
            Alert.alert('שגיאה', 'לא ניתן להגדיר יום חופש לתאריך בעבר')
            return
        }

        try {
            setLoading(true)
            setError('')

            const dayOffData = {
                date: date.toISOString().split('T')[0],
                reason: reason.trim(),
                isFullDay,
                ...(isFullDay ? {} : { startTime, endTime })
            }

            const response = await apiClient.post(`${config.BASE_URL}/day-off`, dayOffData)

            if (response.ok) {
                Alert.alert('הצלחה', 'יום החופש נוסף בהצלחה')
                router.back()
            } else {
                const errorData = await response.json()
                throw new Error(errorData.error || 'שגיאה בהוספת יום החופש')
            }
        } catch (error) {
            console.error('Error adding day off:', error)
            setError(error.message || 'שגיאה בהוספת יום החופש')
        } finally {
            setLoading(false)
        }
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
                    <Text style={styles.title}>הוספת יום חופש</Text>
                </View>

                {!!error && (
                    <View style={styles.errorContainer}>
                        <MaterialCommunityIcons name="alert-circle" size={20} color="#ef4444" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {/* Date Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>בחירת תאריך</Text>

                    <Pressable
                        style={styles.dateButton}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <MaterialCommunityIcons name="calendar" size={20} color="#6b7280" />
                        <Text style={styles.dateButtonText}>{formatDate(date)}</Text>
                        <MaterialCommunityIcons name="chevron-down" size={20} color="#6b7280" />
                    </Pressable>

                    {showDatePicker && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display="default"
                            onChange={onDateChange}
                            minimumDate={new Date()}
                        />
                    )}
                </View>

                {/* Reason */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>סיבה ליום החופש</Text>

                    <TextInput
                        style={styles.reasonInput}
                        value={reason}
                        onChangeText={setReason}
                        placeholder="למשל: חופשה, מחלה, אירוע משפחתי..."
                        multiline
                        numberOfLines={3}
                        textAlign="right"
                    />
                </View>

                {/* Full Day Toggle */}
                <View style={styles.section}>
                    <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>יום חופש מלא</Text>
                        <Switch
                            value={isFullDay}
                            onValueChange={setIsFullDay}
                            trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
                            thumbColor={isFullDay ? '#ffffff' : '#f3f4f6'}
                        />
                    </View>

                    {!isFullDay && (
                        <Text style={styles.toggleDescription}>
                            אם תכבה את זה, תוכל להגדיר שעות ספציפיות ליום החופש
                        </Text>
                    )}
                </View>

                {/* Partial Day Times */}
                {!isFullDay && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>שעות חופש</Text>

                        <View style={styles.timeInputs}>
                            <View style={styles.timeRow}>
                                <Text style={styles.timeLabel}>התחלה:</Text>
                                <Pressable
                                    style={styles.timeButton}
                                    onPress={() => openTimePicker('start')}
                                >
                                    <Text style={styles.timeButtonText}>{formatTime(startTime)}</Text>
                                    <MaterialCommunityIcons name="clock-outline" size={16} color="#6b7280" />
                                </Pressable>
                            </View>

                            <View style={styles.timeRow}>
                                <Text style={styles.timeLabel}>סיום:</Text>
                                <Pressable
                                    style={styles.timeButton}
                                    onPress={() => openTimePicker('end')}
                                >
                                    <Text style={styles.timeButtonText}>{formatTime(endTime)}</Text>
                                    <MaterialCommunityIcons name="clock-outline" size={16} color="#6b7280" />
                                </Pressable>
                            </View>
                        </View>
                    </View>
                )}

                {/* Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>סיכום</Text>

                    <View style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>תאריך:</Text>
                            <Text style={styles.summaryValue}>{formatDate(date)}</Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>סיבה:</Text>
                            <Text style={styles.summaryValue}>{reason || 'לא צוינה'}</Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>סוג:</Text>
                            <Text style={styles.summaryValue}>
                                {isFullDay ? 'יום מלא' : 'חלקי'}
                            </Text>
                        </View>

                        {!isFullDay && (
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>שעות:</Text>
                                <Text style={styles.summaryValue}>
                                    {startTime} - {endTime}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Add Button */}
                <Pressable
                    disabled={loading}
                    onPress={addDayOff}
                    style={[styles.addButton, loading && { opacity: 0.7 }]}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                        <Text style={styles.addButtonText}>הוספת יום חופש</Text>
                    )}
                </Pressable>
            </ScrollView>

            {/* Time Picker */}
            {showTimePicker && (
                <View style={styles.timePickerContainer}>
                    <View style={styles.timePickerHeader}>
                        <Text style={styles.timePickerTitle}>
                            בחר {timePickerType === 'start' ? 'שעת התחלה' : 'שעת סיום'}
                        </Text>
                        <Pressable
                            style={styles.closeButton}
                            onPress={() => setShowTimePicker(false)}
                        >
                            <MaterialCommunityIcons name="close" size={20} color="#6b7280" />
                        </Pressable>
                    </View>
                    <DateTimePicker
                        value={getTimeFromString(timePickerType === 'start' ? startTime : endTime)}
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
        padding: 16,
        gap: 12
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        textAlign: 'right'
    },
    dateButton: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f9fafb',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    dateButtonText: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '500'
    },
    reasonInput: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        textAlignVertical: 'top'
    },
    toggleRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    toggleLabel: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '500'
    },
    toggleDescription: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'right',
        fontStyle: 'italic'
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
    timeButton: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        minWidth: 80
    },
    timeButtonText: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '500'
    },
    summaryCard: {
        backgroundColor: '#f9fafb',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        gap: 8
    },
    summaryRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    summaryLabel: {
        fontSize: 14,
        color: '#6b7280'
    },
    summaryValue: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '500'
    },
    addButton: {
        backgroundColor: '#3b82f6',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16
    },
    addButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16
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
