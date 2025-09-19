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
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import config from '../config'
import apiClient from '../lib/apiClient'
import SafeScreen from './components/SafeScreen'

export default function AddDayOff() {
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isPartialDayOff, setIsPartialDayOff] = useState(false)
    const [startTime, setStartTime] = useState('09:00')
    const [endTime, setEndTime] = useState('17:00')
    const [showStartTimePicker, setShowStartTimePicker] = useState(false)
    const [showEndTimePicker, setShowEndTimePicker] = useState(false)
    const [tempStartTime, setTempStartTime] = useState('09:00')
    const [tempEndTime, setTempEndTime] = useState('17:00')

    const formatDate = (date) => {
        return date.toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    }

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false)
        if (selectedDate) {
            console.log('selectedDate UTC:', selectedDate)
            console.log('selectedDate UTC string:', selectedDate.toISOString())

            // פתרון פשוט - שימוש ב-toLocaleDateString לחילוץ התאריך
            const dateString = selectedDate.toLocaleDateString('en-CA') // YYYY-MM-DD format
            console.log('dateString from toLocaleDateString:', dateString)

            // יצירת תאריך חדש מהמחרוזת עם UTC
            const [year, month, day] = dateString.split('-').map(Number)
            const localDate = new Date(Date.UTC(year, month - 1, day)) // שימוש ב-UTC

            console.log('year:', year, 'month:', month - 1, 'day:', day)
            console.log('localDate:', localDate)
            console.log('localDate string:', localDate.toISOString())
            setSelectedDate(localDate)
        }
    }

    const handleStartTimeChange = (event, selectedTime) => {
        if (selectedTime) {
            const timeString = selectedTime.toTimeString().slice(0, 5)
            setTempStartTime(timeString) // עדכון זמני בלבד
        }
    }

    const handleEndTimeChange = (event, selectedTime) => {
        if (selectedTime) {
            const timeString = selectedTime.toTimeString().slice(0, 5)
            setTempEndTime(timeString) // עדכון זמני בלבד
        }
    }

    const confirmStartTime = () => {
        setStartTime(tempStartTime)
        setShowStartTimePicker(false)
    }

    const confirmEndTime = () => {
        setEndTime(tempEndTime)
        setShowEndTimePicker(false)
    }

    const cancelStartTime = () => {
        setTempStartTime(startTime) // חזרה לערך המקורי
        setShowStartTimePicker(false)
    }

    const cancelEndTime = () => {
        setTempEndTime(endTime) // חזרה לערך המקורי
        setShowEndTimePicker(false)
    }

    const handleStartTimePress = () => {
        if (showStartTimePicker) {
            setShowStartTimePicker(false) // סגור אם פתוח
        } else {
            setTempStartTime(startTime) // הגדר את הערך הזמני לערך הנוכחי
            setShowStartTimePicker(true)
            setShowEndTimePicker(false) // סגור את השני
        }
    }

    const handleEndTimePress = () => {
        if (showEndTimePicker) {
            setShowEndTimePicker(false) // סגור אם פתוח
        } else {
            setTempEndTime(endTime) // הגדר את הערך הזמני לערך הנוכחי
            setShowEndTimePicker(true)
            setShowStartTimePicker(false) // סגור את הראשון
        }
    }


    const handleSubmit = async () => {
        try {
            setLoading(true)

            // בדיקה שהתאריך לא בעבר
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            if (selectedDate < today) {
                Alert.alert('שגיאה', 'לא ניתן להוסיף יום חופש בעבר')
                return
            }

            // בדיקת תקינות שעות
            if (isPartialDayOff && startTime >= endTime) {
                Alert.alert('שגיאה', 'שעת הסיום חייבת להיות אחרי שעת ההתחלה')
                return
            }

            // שליחה לבקנד
            const dateString = selectedDate.toISOString().split('T')[0]
            console.log('📅 Selected date object:', selectedDate)
            console.log('📅 Date string to send:', dateString)

            const dayOffData = {
                date: dateString, // YYYY-MM-DD format
                reason: 'יום חופש',
                isFullDay: !isPartialDayOff, // הבקנד מצפה ל-isFullDay
                ...(isPartialDayOff && {
                    startTime: startTime,
                    endTime: endTime
                })
            }

            console.log('📅 Adding day off:', dayOffData)

            const response = await apiClient.post(`${config.BASE_URL}/day-off`, dayOffData)

            if (response.ok) {
                Alert.alert(
                    'הצלחה',
                    'יום החופש נוסף בהצלחה',
                    [
                        {
                            text: 'אישור',
                            onPress: () => router.back()
                        }
                    ]
                )
            } else {
                const errorData = await response.text()
                console.log('❌ Error adding day off:', errorData)

                try {
                    const errorJson = JSON.parse(errorData)
                    const errorMessage = errorJson.error || 'לא ניתן להוסיף את יום החופש'
                    Alert.alert('שגיאה', errorMessage)
                } catch (_parseError) {
                    Alert.alert('שגיאה', 'לא ניתן להוסיף את יום החופש')
                }
            }
        } catch (error) {
            console.error('❌ Error adding day off:', error)
            Alert.alert('שגיאה', 'אירעה שגיאה בהוספת יום החופש')
        } finally {
            setLoading(false)
        }
    }

    return (
        <SafeScreen backgroundColor="#f8fafc">
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <MaterialCommunityIcons name="arrow-right" size={24} color="#3b82f6" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>הוסף יום חופש</Text>
                </View>

                <View style={styles.content}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>בחר תאריך</Text>

                        <Pressable
                            style={styles.dateButton}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <MaterialCommunityIcons name="calendar" size={20} color="#3b82f6" />
                            <Text style={styles.dateButtonText}>
                                {formatDate(selectedDate)}
                            </Text>
                            <MaterialCommunityIcons name="chevron-down" size={20} color="#6b7280" />
                        </Pressable>

                        {showDatePicker && (
                            <DateTimePicker
                                value={selectedDate}
                                mode="date"
                                display="default"
                                onChange={handleDateChange}
                                minimumDate={new Date()}
                            />
                        )}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>סוג יום החופש</Text>

                        <View style={styles.dayOffTypeContainer}>
                            <Pressable
                                style={[styles.typeButton, !isPartialDayOff && styles.activeTypeButton]}
                                onPress={() => setIsPartialDayOff(false)}
                            >
                                <MaterialCommunityIcons
                                    name="calendar-remove"
                                    size={20}
                                    color={!isPartialDayOff ? '#ffffff' : '#3b82f6'}
                                />
                                <Text style={[styles.typeButtonText, !isPartialDayOff && styles.activeTypeButtonText]}>
                                    יום חופש מלא
                                </Text>
                            </Pressable>

                            <Pressable
                                style={[styles.typeButton, isPartialDayOff && styles.activeTypeButton]}
                                onPress={() => setIsPartialDayOff(true)}
                            >
                                <MaterialCommunityIcons
                                    name="clock-outline"
                                    size={20}
                                    color={isPartialDayOff ? '#ffffff' : '#3b82f6'}
                                />
                                <Text style={[styles.typeButtonText, isPartialDayOff && styles.activeTypeButtonText]}>
                                    יום חופש חלקי
                                </Text>
                            </Pressable>
                        </View>
                    </View>

                    {isPartialDayOff && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>בחר טווח שעות</Text>
                            <View style={styles.timeContainer}>

                                <View style={styles.timeInputContainer}>
                                    <Text style={styles.timeLabel}>עד שעה:</Text>
                                    <Pressable
                                        style={styles.timeButton}
                                        onPress={handleEndTimePress}
                                    >
                                        <MaterialCommunityIcons name="clock" size={16} color="#3b82f6" />
                                        <Text style={styles.timeButtonText}>{endTime}</Text>
                                    </Pressable>
                                </View>

                                <View style={styles.timeInputContainer}>
                                    <Text style={styles.timeLabel}>משעה:</Text>
                                    <Pressable
                                        style={styles.timeButton}
                                        onPress={handleStartTimePress}
                                    >
                                        <MaterialCommunityIcons name="clock" size={16} color="#3b82f6" />
                                        <Text style={styles.timeButtonText}>{startTime}</Text>
                                    </Pressable>
                                </View>
                            </View>

                            {showStartTimePicker && (
                                <View style={styles.pickerContainer}>
                                    <DateTimePicker
                                        value={new Date(`2000-01-01T${tempStartTime}`)}
                                        mode="time"
                                        display="spinner"
                                        onChange={handleStartTimeChange}
                                        is24Hour={true}
                                    />
                                    <View style={styles.pickerButtons}>
                                        <TouchableOpacity
                                            style={styles.cancelButton}
                                            onPress={cancelStartTime}
                                        >
                                            <Text style={styles.cancelButtonText}>ביטול</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.confirmButton}
                                            onPress={confirmStartTime}
                                        >
                                            <Text style={styles.confirmButtonText}>אישור</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            {showEndTimePicker && (
                                <View style={styles.pickerContainer}>
                                    <DateTimePicker
                                        value={new Date(`2000-01-01T${tempEndTime}`)}
                                        mode="time"
                                        display="spinner"
                                        onChange={handleEndTimeChange}
                                        is24Hour={true}
                                    />
                                    <View style={styles.pickerButtons}>
                                        <TouchableOpacity
                                            style={styles.cancelButton}
                                            onPress={cancelEndTime}
                                        >
                                            <Text style={styles.cancelButtonText}>ביטול</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.confirmButton}
                                            onPress={confirmEndTime}
                                        >
                                            <Text style={styles.confirmButtonText}>אישור</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    <View style={styles.infoSection}>
                        <MaterialCommunityIcons name="information" size={20} color="#6b7280" />
                        <Text style={styles.infoText}>
                            {isPartialDayOff
                                ? `יום החופש החלקי ימנע קביעת תורים בין ${startTime} ל-${endTime}`
                                : 'יום החופש ימנע קביעת תורים בתאריך הנבחר'
                            }
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.disabledButton]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="check" size={20} color="#ffffff" />
                                <Text style={styles.submitButtonText}>הוסף יום חופש</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeScreen>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        padding: 8,
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1f2937',
        textAlign: 'right',
    },
    content: {
        padding: 16,
    },
    section: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 12,
        textAlign: 'right',
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    dateButtonText: {
        fontSize: 16,
        color: '#1f2937',
        textAlign: 'right',
        flex: 1,
        marginHorizontal: 12,
    },
    infoSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f9ff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 24,
        gap: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#0369a1',
        textAlign: 'right',
        flex: 1,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3b82f6',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    disabledButton: {
        backgroundColor: '#9ca3af',
    },
    submitButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    dayOffTypeContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    typeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3b82f6',
        backgroundColor: 'transparent',
        gap: 8,
    },
    activeTypeButton: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    typeButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#3b82f6',
        textAlign: 'center',
    },
    activeTypeButtonText: {
        color: '#ffffff',
    },
    timeContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    timeInputContainer: {
        flex: 1,
    },
    timeLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280',
        marginBottom: 8,
        textAlign: 'right',
    },
    timeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        gap: 8,
    },
    timeButtonText: {
        fontSize: 16,
        color: '#1f2937',
        textAlign: 'right',
        flex: 1,
    },
    pickerContainer: {
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        padding: 16,
        marginTop: 12,
    },
    pickerButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#ffffff',
        alignItems: 'center',
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#3b82f6',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280',
    },
    confirmButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#ffffff',
    },
})
