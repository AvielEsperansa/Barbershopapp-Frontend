import { MaterialCommunityIcons } from '@expo/vector-icons'
import React, { useState } from 'react'
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native'

export default function DateTimePicker({
    visible,
    onClose,
    onConfirm,
    initialDate = '',
    initialTime = '',
    title = 'בחר תאריך ושעה'
}) {
    const [selectedDate, setSelectedDate] = useState(initialDate)
    const [selectedTime, setSelectedTime] = useState(initialTime)

    // יצירת רשימת תאריכים זמינים (30 הימים הקרובים)
    const generateAvailableDates = () => {
        const dates = []
        const today = new Date()

        for (let i = 0; i < 30; i++) {
            const date = new Date(today)
            date.setDate(today.getDate() + i)

            // רק ימי חול (א'-ה')
            if (date.getDay() >= 1 && date.getDay() <= 5) {
                dates.push({
                    value: date.toISOString().split('T')[0],
                    label: date.toLocaleDateString('he-IL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'short'
                    })
                })
            }
        }

        return dates
    }

    // יצירת רשימת שעות זמינות
    const generateAvailableTimes = () => {
        const times = []
        const startHour = 9 // 9:00
        const endHour = 18 // 18:00

        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
                times.push({
                    value: timeString,
                    label: timeString
                })
            }
        }

        return times
    }

    const availableDates = generateAvailableDates()
    const availableTimes = generateAvailableTimes()

    const handleConfirm = () => {
        if (selectedDate && selectedTime) {
            onConfirm(selectedDate, selectedTime)
            onClose()
        }
    }

    const formatSelectedDateTime = () => {
        if (!selectedDate || !selectedTime) return 'לא נבחר'

        const date = new Date(selectedDate)
        const formattedDate = date.toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'short'
        })

        return `${formattedDate} בשעה ${selectedTime}`
    }

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* בחירת תאריך */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>בחר תאריך</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.horizontalScroll}
                            >
                                {availableDates.map((date) => (
                                    <TouchableOpacity
                                        key={date.value}
                                        style={[
                                            styles.dateTimeOption,
                                            selectedDate === date.value && styles.selectedOption
                                        ]}
                                        onPress={() => setSelectedDate(date.value)}
                                    >
                                        <Text style={[
                                            styles.optionText,
                                            selectedDate === date.value && styles.selectedOptionText
                                        ]}>
                                            {date.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* בחירת שעה */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>בחר שעה</Text>
                            <View style={styles.timeGrid}>
                                {availableTimes.map((time) => (
                                    <TouchableOpacity
                                        key={time.value}
                                        style={[
                                            styles.timeOption,
                                            selectedTime === time.value && styles.selectedOption
                                        ]}
                                        onPress={() => setSelectedTime(time.value)}
                                    >
                                        <Text style={[
                                            styles.optionText,
                                            selectedTime === time.value && styles.selectedOptionText
                                        ]}>
                                            {time.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* סיכום הבחירה */}
                        <View style={styles.summarySection}>
                            <Text style={styles.summaryTitle}>סיכום הבחירה:</Text>
                            <Text style={styles.summaryText}>{formatSelectedDateTime()}</Text>
                        </View>
                    </ScrollView>

                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.cancelButton]}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelButtonText}>ביטול</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.modalButton,
                                styles.confirmButton,
                                (!selectedDate || !selectedTime) && styles.disabledButton
                            ]}
                            onPress={handleConfirm}
                            disabled={!selectedDate || !selectedTime}
                        >
                            <Text style={[
                                styles.confirmButtonText,
                                (!selectedDate || !selectedTime) && styles.disabledButtonText
                            ]}>
                                אישור
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        width: '100%',
        maxWidth: 500,
        maxHeight: '80%'
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb'
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        flex: 1,
        textAlign: 'right'
    },
    closeButton: {
        padding: 4
    },
    scrollContent: {
        maxHeight: 400
    },
    section: {
        paddingHorizontal: 20,
        paddingVertical: 16
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
        textAlign: 'right'
    },
    horizontalScroll: {
        marginHorizontal: -20
    },
    dateTimeOption: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    timeOption: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        margin: 4,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        minWidth: 80,
        alignItems: 'center'
    },
    selectedOption: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6'
    },
    optionText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center'
    },
    selectedOptionText: {
        color: '#ffffff',
        fontWeight: '600'
    },
    timeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start'
    },
    summarySection: {
        backgroundColor: '#f8fafc',
        padding: 16,
        marginHorizontal: 20,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    summaryTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 4,
        textAlign: 'right'
    },
    summaryText: {
        fontSize: 16,
        color: '#111827',
        textAlign: 'right'
    },
    modalActions: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb'
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center'
    },
    cancelButton: {
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#d1d5db'
    },
    confirmButton: {
        backgroundColor: '#3b82f6'
    },
    disabledButton: {
        backgroundColor: '#d1d5db'
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b7280'
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff'
    },
    disabledButtonText: {
        color: '#9ca3af'
    }
})
