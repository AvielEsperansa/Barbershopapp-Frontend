import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { useFocusEffect, useLocalSearchParams } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native'
import { Calendar } from 'react-native-calendars'
import config from '../../config'
import apiClient from '../../lib/apiClient'
import notificationManager from '../../lib/notificationManager'

const STEP = {
    BARBER: 0,
    SERVICE: 1,
    DATE: 2,
    TIME: 3,
    SUMMARY: 4,
}

export default function CustomerAppointment() {
    const params = useLocalSearchParams()
    const [step, setStep] = useState(STEP.BARBER)
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState('')
    const tabBarHeight = useBottomTabBarHeight()

    const [barbers, setBarbers] = useState([])
    const [services, setServices] = useState([])

    const [selectedBarber, setSelectedBarber] = useState(null)
    const [selectedService, setSelectedService] = useState(null)

    const [selectedDate, setSelectedDate] = useState(null) // stores date object or YYYY-MM-DD
    const [availableSlots, setAvailableSlots] = useState([])
    const [selectedSlot, setSelectedSlot] = useState(null)
    const [notes, setNotes] = useState('')
    const [myAppointments, setMyAppointments] = useState([])
    const { width: screenWidth } = useWindowDimensions()
    const slotColumns = screenWidth < 360 ? 2 : screenWidth < 768 ? 3 : 4

    // Using Calendar component instead of generating pills for the next 30 days

    const pad2 = (n) => String(n).padStart(2, '0')
    const toDateKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

    const goBackStep = () => {
        if (step === STEP.BARBER) return
        if (step === STEP.SUMMARY) {
            setStep(STEP.TIME)
            return
        }
        if (step === STEP.TIME) {
            setSelectedSlot(null)
            setStep(STEP.DATE)
            return
        }
        if (step === STEP.DATE) {
            setSelectedDate(null)
            setAvailableSlots([])
            setSelectedSlot(null)
            setStep(STEP.SERVICE)
            return
        }
        if (step === STEP.SERVICE) {
            setSelectedService(null)
            setSelectedDate(null)
            setAvailableSlots([])
            setSelectedSlot(null)
            setStep(STEP.BARBER)
            return
        }
    }

    const fetchBarbers = useCallback(async () => {
        const endpoints = [
            `${config.BASE_URL}/users/barbers`,
        ]
        for (const url of endpoints) {
            try {
                const res = await apiClient.get(url)
                if (!res.ok) continue
                const json = await res.json()
                const arr = json.users || json.barbers || json.data || json
                if (Array.isArray(arr)) {
                    const onlyBarbers = arr.filter((u) => u?.role === 'barber')
                    return onlyBarbers.length > 0 ? onlyBarbers : arr
                }
            } catch (_e) {
                // try next endpoint
            }
        }
        return []
    }, [])

    const loadMyAppointments = useCallback(async () => {
        try {
            const response = await apiClient.get(`${config.BASE_URL}/appointments/`)
            const data = await response.json()

            if (!response.ok) {
                setMyAppointments([])
                return
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

            setMyAppointments(appointmentsWithDate)

        } catch (error) {
            console.error('Error loading appointments:', error)
            setMyAppointments([])
        }
    }, [])

    const refreshAllData = useCallback(async (showSpinner = true, resetWizard = false) => {
        if (showSpinner) setLoading(true)
        setError('')
        if (resetWizard) {
            setStep(STEP.BARBER)
            setSelectedBarber(null)
            setSelectedService(null)
            setSelectedDate(null)
            setSelectedSlot(null)
            setAvailableSlots([])
        }
        try {
            // Load services
            const servicesRes = await apiClient.get(`${config.BASE_URL}/services`).catch(() => null)
            if (servicesRes && servicesRes.ok) {
                const servicesJson = await servicesRes.json()
                const servicesData = servicesJson.services || servicesJson
                setServices(Array.isArray(servicesData) ? servicesData : [])
            }

            // Load barbers
            const b = await fetchBarbers()
            setBarbers(Array.isArray(b) ? b : [])

            // Load upcoming appointments
            await loadMyAppointments()
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load data')
        } finally {
            if (showSpinner) setLoading(false)
        }
    }, [fetchBarbers, loadMyAppointments])

    // רענון בעת מעבר לטאב
    useFocusEffect(
        useCallback(() => {
            refreshAllData(true)
        }, [refreshAllData])
    )

    // רענון אם נלחץ הטאב שוב מחדש
    useEffect(() => {
        if (params?.refresh) {
            refreshAllData(false, true)
        }
    }, [params?.refresh, refreshAllData])


    const onSelectBarber = async (barber) => {
        setSelectedBarber(barber)
        setLoading(true)
        setError('')
        setStep(STEP.SERVICE)
        setLoading(false)
    }



    const onSelectDate = async (date) => {
        // Support both Date and string keys from Calendar
        const key = typeof date === 'string' ? date : toDateKey(date)

        // בדיקה שהתאריך לא בעבר - לפני כל דבר אחר
        const selectedDateObj = new Date(key)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (selectedDateObj < today) {
            Alert.alert('שגיאה', 'לא ניתן לבחור תאריך בעבר')
            return
        }

        setSelectedDate(key)
        setSelectedSlot(null)
        if (!selectedBarber || !selectedBarber._id) {
            Alert.alert('שגיאה', 'לא נבחר ספר או אין ID לספר')
            return
        }

        setLoading(true)
        setError('')
        try {
            // וידוא שהתאריך בפורמט הנכון (YYYY-MM-DD)
            const formattedDate = typeof key === 'string' ? key : key.toISOString().split('T')[0]

            // בדיקה שהתאריך בפורמט תקין
            if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
                Alert.alert('שגיאה', `פורמט תאריך לא תקין: ${formattedDate}`)
                return
            }
            const query = new URLSearchParams({
                barberId: selectedBarber._id,
                date: formattedDate,
            }).toString()
            console.log('Fetching slots with query:', query)
            const res = await apiClient.get(`${config.BASE_URL}/appointments/slots?${query}`)
            const json = await res.json()
            console.log('Slots response:', json)
            if (!res.ok) {
                throw new Error(json?.error || 'Failed to load available slots')
            }
            const slots = Array.isArray(json.slots) ? json.slots : []
            console.log('Available slots count:', slots.length)
            setAvailableSlots(slots)

            if (!slots || slots.length === 0) {
                Alert.alert('אין תורים פנויים בתאריך זה')
                return // לא עוברים לשלב הבא אם אין תורים
            }

            setStep(STEP.TIME)
        } catch (e) {
            Alert.alert('שגיאה', e instanceof Error ? e.message : 'נכשל לטעון זמנים פנויים')
        } finally {
            setLoading(false)
        }
    }

    const getMarkedDates = () => {
        // Mark all dates: disable past days (not today)
        const marks = {}
        const today = new Date()
        today.setHours(0, 0, 0, 0) // Reset time to start of day

        // נסמן את כל התאריכים מ-30 ימים אחורה ועד 60 ימים קדימה
        for (let i = -30; i < 60; i++) {
            const d = new Date(today)
            d.setDate(today.getDate() + i)
            const key = toDateKey(d)

            // בדיקה אם התאריך הוא בעבר (לא כולל היום)
            const isPast = d.getTime() < today.getTime()

            marks[key] = {
                disabled: isPast, // נבטל רק תאריכים בעבר
                disableTouchEvent: isPast, // נמנע לחיצה על תאריכים בעבר
                textColor: isPast ? '#3f3f46' : '#ffffff', // צבע טקסט כהה לתאריכים בעבר
                selectedColor: '#dc2626'
            }
        }

        if (selectedDate) {
            const k = typeof selectedDate === 'string' ? selectedDate : toDateKey(selectedDate)
            marks[k] = { ...(marks[k] || {}), selected: true, selectedColor: '#dc2626' }
        }
        return marks
    }

    const onCreateAppointment = async () => {
        if (!selectedBarber || !selectedService || !selectedDate || !selectedSlot) {
            Alert.alert('נא להשלים את כל השדות')
            return
        }
        setLoading(true)
        setError('')
        try {
            // יצירת תאריך ללא timezone conversion
            const appointmentDate = new Date(selectedDate)
            // נוסיף את השעה המקומית כדי למנוע בעיות timezone
            appointmentDate.setHours(12, 0, 0, 0) // שעה 12:00 כדי להיות בטוחים

            console.log('📅 Creating appointment with date:', {
                selectedDate: selectedDate,
                appointmentDate: appointmentDate,
                isoString: appointmentDate.toISOString(),
                localString: appointmentDate.toLocaleDateString('he-IL')
            })

            const body = {
                barberId: selectedBarber._id,
                serviceId: selectedService._id,
                date: appointmentDate.toISOString(),
                startTime: selectedSlot.startTime,
                notes,
            }
            const res = await apiClient.post(`${config.BASE_URL}/appointments`, body)
            const json = await res.json()
            if (!res.ok) {
                throw new Error(json?.error || 'Failed to create appointment')
            }
            Alert.alert('נקבע תור בהצלחה')
            console.log("----------------------------------------- appointment created", json);

            // תזכורת 24 שעות לפני התור
            try {
                await notificationManager.scheduleAppointmentReminder({
                    id: json.appointment?._id || json._id,
                    barberName: `${selectedBarber.firstName} ${selectedBarber.lastName}`,
                    serviceName: selectedService.name,
                    date: selectedDate,
                    startTime: selectedSlot.startTime
                });
            } catch (notificationError) {
                console.log('Failed to schedule reminder:', notificationError);
            }

            await loadMyAppointments()

            // עדכון אופטימי של הזמנים הפנויים
            if (selectedSlot) {
                setAvailableSlots(prevSlots =>
                    prevSlots.map(slot =>
                        slot.startTime === selectedSlot.startTime
                            ? { ...slot, isAvailable: false }
                            : slot
                    )
                )
            }

            // רענון הזמנים הפנויים אם אנחנו עדיין באותו תאריך
            if (selectedDate) {
                await onSelectDate(selectedDate)
            }

            setStep(STEP.BARBER)
            setSelectedBarber(null)
            setSelectedService(null)
            setSelectedDate(null)
            setSelectedSlot(null)
            setNotes('')
        } catch (e) {
            Alert.alert('שגיאה', e instanceof Error ? e.message : 'אירעה שגיאה')
        } finally {
            setLoading(false)
        }
    }

    const onCancelAppointment = async (appointment) => {
        const appt = appointment || (myAppointments && myAppointments[0])
        if (!appt) return
        const apptId = appt._id || appt.id
        if (!apptId) {
            Alert.alert('שגיאה', 'לא נמצא מזהה תור לביטול')
            return
        }
        Alert.alert(
            'ביטול תור',
            'האם לבטל את התור הקרוב?',
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
                                setMyAppointments((prev) => (prev || []).filter((x) => (x._id || x.id) !== apptId))
                                await loadMyAppointments()
                            }
                        } finally {
                            setLoading(false)
                        }
                    }
                }
            ]
        )
    }

    const renderStepWizard = () => {
        const stepsList = [
            { id: STEP.BARBER, label: 'ספר', icon: 'account' },
            { id: STEP.SERVICE, label: 'טיפול', icon: 'content-cut' },
            { id: STEP.DATE, label: 'תאריך', icon: 'calendar-month' },
            { id: STEP.TIME, label: 'שעה', icon: 'clock-outline' },
            { id: STEP.SUMMARY, label: 'סיכום', icon: 'check-circle-outline' },
        ];

        return (
            <View style={styles.wizardRow}>
                {stepsList.map((s) => {
                    const isActive = step === s.id;
                    const isDone = step > s.id;

                    return (
                        <View key={s.id} style={styles.wizardItem}>
                            <View style={[
                                styles.wizardIconCircle,
                                isActive && styles.wizardIconActive,
                                isDone && styles.wizardIconDone
                            ]}>
                                <MaterialCommunityIcons
                                    name={isDone ? 'check' : s.icon}
                                    size={16}
                                    color={isActive ? '#ffffff' : isDone ? '#2563eb' : '#94a3b8'}
                                />
                            </View>
                            <Text style={[
                                styles.wizardLabel,
                                isActive && styles.wizardLabelActive,
                                isDone && styles.wizardLabelDone
                            ]}>
                                {s.label}
                            </Text>
                        </View>
                    );
                })}
            </View>
        );
    };

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <View style={styles.headerRow}>
                {step !== STEP.BARBER && (
                    <Pressable
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            goBackStep();
                        }}
                        style={styles.backButton}
                    >
                        <MaterialCommunityIcons name="arrow-right" size={20} color="#1f2937" />
                        <Text style={styles.backText}>חזרה</Text>
                    </Pressable>
                )}
                <Text style={styles.title}>קביעת תור למספרה ✂️</Text>
            </View>
            {renderStepWizard()}
        </View>
    )

    const BarberCard = ({ item }) => (
        <Pressable
            style={({ pressed }) => [
                styles.card,
                selectedBarber?._id === item._id && styles.cardSelected,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
            ]}
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelectBarber(item);
            }}
        >
            <View style={styles.avatarCircle}>
                <MaterialCommunityIcons name="content-cut" size={24} color="#2563eb" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.firstName} {item.lastName}</Text>
                <View style={styles.badgeRow}>
                    <Text style={styles.cardSubtitle}>ספר מקצועי</Text>
                    <View style={styles.ratingBadge}>
                        <MaterialCommunityIcons name="star" size={12} color="#d97706" />
                        <Text style={styles.ratingText}>4.9</Text>
                    </View>
                </View>
            </View>
            <MaterialCommunityIcons name="chevron-left" size={24} color="#6b7280" />
        </Pressable>
    )

    const ServiceCard = ({ item }) => (
        <Pressable
            style={({ pressed }) => [
                styles.card,
                selectedService?._id === item._id && styles.cardSelected,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
            ]}
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedService(item);
                setStep(STEP.DATE);
            }}
        >
            <View style={[styles.avatarCircle, { backgroundColor: '#fef3c7' }]}>
                <MaterialCommunityIcons name="scissors-cutting" size={24} color="#d97706" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <View style={styles.badgeRow}>
                    <View style={styles.durationPill}>
                        <MaterialCommunityIcons name="clock-outline" size={12} color="#475569" />
                        <Text style={styles.durationText}>{item.durationMinutes} דק׳</Text>
                    </View>
                    <Text style={styles.priceText}>₪{item.price}</Text>
                </View>
            </View>
            <MaterialCommunityIcons name="chevron-left" size={24} color="#6b7280" />
        </Pressable>
    )

    const SlotPill = ({ slot }) => {
        const isSelected = selectedSlot && selectedSlot.startTime === slot.startTime
        return (
            <Pressable
                disabled={!slot.isAvailable}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setSelectedSlot(slot);
                    setStep(STEP.SUMMARY);
                }}
                style={({ pressed }) => [
                    styles.slotPill,
                    isSelected && styles.slotPillSelected,
                    !slot.isAvailable && styles.slotPillDisabled,
                    pressed && slot.isAvailable && { opacity: 0.8 }
                ]}
            >
                <Text style={[styles.slotPillText, isSelected && styles.slotPillTextSelected, !slot.isAvailable && styles.slotPillTextDisabled]}>
                    {slot.startTime}
                </Text>
            </Pressable>
        )
    }

    const getSelectedDateDisplay = () => {
        if (!selectedDate) return ''
        const d = typeof selectedDate === 'string' ? new Date(selectedDate) : selectedDate
        return d instanceof Date && !isNaN(d.getTime()) ? d.toLocaleDateString('he-IL') : String(selectedDate)
    }

    return (
        <View style={[styles.container]}>
            {renderHeader()}

            {loading && (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            )}

            {!!error && (
                <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View>
            )}

            <ScrollView
                contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={async () => {
                            setRefreshing(true)
                            await refreshAllData(false, true)
                            setRefreshing(false)
                        }}
                        colors={['#3b82f6']}
                        tintColor="#3b82f6"
                    />
                }
            >
                {!loading && step === STEP.BARBER && (
                    <View style={styles.list}>
                        {barbers.length === 0 ? (
                            <Text style={styles.empty}>אין ספרים להצגה</Text>
                        ) : (
                            barbers.map((item) => (
                                <BarberCard key={item._id} item={item} />
                            ))
                        )}
                    </View>
                )}

                {!loading && step === STEP.SERVICE && (
                    <View style={styles.list}>
                        {services.length === 0 ? (
                            <Text style={styles.empty}>אין טיפולים זמינים</Text>
                        ) : (
                            services.map((item) => (
                                <ServiceCard key={item._id} item={item} />
                            ))
                        )}
                    </View>
                )}

                {!loading && step === STEP.DATE && (
                    <View style={{ paddingHorizontal: 16 }}>
                        <Text style={styles.sectionTitle}>בחרו תאריך (מהיום והלאה)</Text>
                        <Text style={styles.helper}>
                            {(() => {
                                const days = selectedBarber?.bookingWindowDays || 30;
                                if (days === 7) return 'ניתן לבחור תאריכים לשבוע הקרוב (7 ימים) בלבד';
                                if (days === 14) return 'ניתן לבחור תאריכים לשבועיים הקרובים (14 ימים) בלבד';
                                return 'ניתן לבחור תאריכים עד חודש קדימה (30 ימים)';
                            })()}
                        </Text>
                        <Calendar
                            onDayPress={(day) => {
                                // בדיקה נוספת שהתאריך לא בעבר
                                const selectedDate = new Date(day.dateString)
                                const today = new Date()
                                today.setHours(0, 0, 0, 0)

                                if (selectedDate < today) {
                                    Alert.alert('שגיאה', 'לא ניתן לבחור תאריך בעבר')
                                    return
                                }

                                const d = new Date(day.dateString)
                                onSelectDate(d)
                            }}
                            markedDates={getMarkedDates()}
                            theme={{
                                backgroundColor: '#18181b',
                                calendarBackground: '#18181b',
                                textSectionTitleColor: '#a1a1aa',
                                selectedDayBackgroundColor: '#dc2626',
                                selectedDayTextColor: '#ffffff',
                                todayTextColor: '#ef4444',
                                dayTextColor: '#ffffff',
                                textDisabledColor: '#3f3f46',
                                dotColor: '#ef4444',
                                selectedDotColor: '#ffffff',
                                arrowColor: '#ef4444',
                                monthTextColor: '#ffffff',
                                indicatorColor: '#ef4444',
                                'stylesheet.calendar.header': {
                                    dayHeader: {
                                        color: '#a1a1aa',
                                        fontWeight: '600'
                                    }
                                }
                            }}
                            minDate={new Date().toISOString().split('T')[0]}
                            maxDate={(() => {
                                const days = (selectedBarber?.bookingWindowDays || 30) - 1;
                                const d = new Date();
                                d.setDate(d.getDate() + days);
                                return d.toISOString().split('T')[0];
                            })()}
                            disableAllTouchEventsForDisabledDays={true}
                            markingType="custom"
                            firstDay={0}
                            hideExtraDays
                            disableArrowLeft={false}
                        />
                        <Text style={styles.helper}>לחץ על תאריך כדי לראות זמנים פנויים</Text>
                    </View>
                )}

                {!loading && step === STEP.TIME && (
                    <View style={{ paddingHorizontal: 16 }}>
                        <Text style={styles.sectionTitle}>בחרו שעה</Text>
                        <View style={styles.slotsGrid}>
                            {availableSlots.map((s) => (
                                <View key={`${s.startTime}-${s.endTime}`} style={[styles.slotWrap, { width: `${100 / slotColumns}%` }]}>
                                    <SlotPill slot={s} />
                                </View>
                            ))}
                        </View>
                        {availableSlots.length === 0 && (
                            <Text style={styles.empty}>אין שעות פנויות בתאריך שנבחר</Text>
                        )}
                    </View>
                )}

                {!loading && step === STEP.SUMMARY && (
                    <View style={styles.summary}>
                        <Text style={styles.sectionTitle}>סיכום</Text>
                        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>ספר:</Text><Text style={styles.summaryValue}>{selectedBarber?.firstName} {selectedBarber?.lastName}</Text></View>
                        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>טיפול:</Text><Text style={styles.summaryValue}>{selectedService?.name} • ₪{selectedService?.price}</Text></View>
                        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>תאריך:</Text><Text style={styles.summaryValue}>{getSelectedDateDisplay()}</Text></View>
                        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>שעה:</Text><Text style={styles.summaryValue}>{selectedSlot?.startTime}</Text></View>
                        <TextInput
                            placeholder="הערות (לא חובה)"
                            placeholderTextColor="#9ca3af"
                            style={styles.notes}
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                        />
                        <Pressable style={styles.confirmButton} onPress={onCreateAppointment}>
                            <Text style={styles.confirmButtonText}>אישור הזמנה</Text>
                        </Pressable>
                    </View>
                )}

                {!loading && myAppointments && myAppointments.length > 0 && (
                    <View style={styles.sectionNext}>
                        <Text style={styles.sectionTitle}>התורים הקרובים שלך</Text>
                        {myAppointments.map((appt) => (
                            <View key={appt._id || appt.id} style={{ gap: 6, marginBottom: 10 }}>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>תאריך:</Text>
                                    <Text style={styles.summaryValue}>{(() => { const d = new Date(appt.date || appt.startDate || appt.startTime); return isNaN(d) ? '-' : d.toLocaleDateString('he-IL') })()}</Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>שעה:</Text>
                                    <Text style={styles.summaryValue}>{appt.startTime || (appt.time && appt.time.start) || '-'}</Text>
                                </View>
                                 {!!(appt.service?.name || appt.serviceName) && (
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>טיפול:</Text>
                                        <Text style={styles.summaryValue}>{appt.service?.name || appt.serviceName}</Text>
                                    </View>
                                )}
                                {!!(appt.barber?.firstName || appt.barberName) && (
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>ספר:</Text>
                                        <Text style={styles.summaryValue}>{appt.barber?.firstName ? `${appt.barber.firstName} ${appt.barber.lastName || ''}`.trim() : appt.barberName}</Text>
                                    </View>
                                )}
                                <Pressable style={styles.cancelButton} onPress={() => onCancelAppointment(appt)}>
                                    <Text style={styles.cancelButtonText}>ביטול תור</Text>
                                </Pressable>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#09090b'
    },
    headerContainer: {
        paddingTop: 20,
        paddingBottom: 14,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(24, 24, 27, 0.95)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(239, 68, 68, 0.25)',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 12,
    },
    headerRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14
    },
    backButton: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    backText: {
        color: '#ef4444',
        fontSize: 14,
        fontWeight: '600'
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'right'
    },
    wizardRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    wizardItem: {
        alignItems: 'center',
        gap: 4,
    },
    wizardIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#27272a',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)',
    },
    wizardIconActive: {
        backgroundColor: '#dc2626',
        borderColor: '#ef4444',
    },
    wizardIconDone: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderColor: '#ef4444',
    },
    wizardLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#a1a1aa',
    },
    wizardLabelActive: {
        color: '#ef4444',
        fontWeight: 'bold',
    },
    wizardLabelDone: {
        color: '#f87171',
    },
    list: {
        padding: 16,
        gap: 12
    },
    card: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        backgroundColor: 'rgba(24, 24, 27, 0.85)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    cardSelected: {
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderWidth: 1.5,
    },
    avatarCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    cardTitle: {
        fontSize: 16,
        color: '#ffffff',
        fontWeight: 'bold',
        textAlign: 'right',
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#a1a1aa',
        textAlign: 'right',
    },
    badgeRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    ratingBadge: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 3,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    ratingText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#f59e0b',
    },
    durationPill: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#27272a',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    durationText: {
        fontSize: 12,
        color: '#d4d4d8',
        fontWeight: '500',
    },
    priceText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#ef4444',
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'right'
    },
    slotPill: {
        borderWidth: 1.5,
        borderColor: 'rgba(239, 68, 68, 0.25)',
        backgroundColor: '#27272a',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 1,
    },
    slotPillSelected: {
        borderColor: '#ef4444',
        backgroundColor: '#dc2626',
    },
    slotPillDisabled: {
        backgroundColor: '#18181b',
        borderColor: '#27272a',
        opacity: 0.4
    },
    slotPillText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    slotPillTextSelected: {
        color: '#ffffff',
    },
    slotsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        paddingVertical: 16
    },
    slotWrap: {
        width: '31%',
        minWidth: 90
    },
    helper: {
        textAlign: 'center',
        color: '#a1a1aa',
        marginTop: 8,
        marginBottom: 8,
        fontSize: 14
    },
    summary: {
        padding: 16,
        gap: 12
    },
    summaryRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        backgroundColor: '#27272a',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)'
    },
    summaryLabel: {
        color: '#a1a1aa'
    },
    summaryValue: {
        color: '#ffffff',
        fontWeight: '600'
    },
    notes: {
        minHeight: 80,
        backgroundColor: '#27272a',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)',
        borderRadius: 10,
        padding: 10,
        textAlign: 'right',
        color: '#ffffff'
    },
    confirmButton: {
        backgroundColor: '#dc2626',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 4,
    },
    confirmButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16
    },
    cancelButton: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 8,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    cancelButtonText: {
        color: '#ef4444',
        fontWeight: '700'
    },
    sectionNext: {
        marginTop: 8,
        padding: 16,
        gap: 8,
        backgroundColor: 'rgba(24, 24, 27, 0.85)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)'
    },
    loading: {
        position: 'absolute',
        top: 0,
        right: 0,
        left: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(9,9,11,0.8)'
    },
    error: {
        paddingHorizontal: 16,
        paddingVertical: 8
    },
    errorText: {
        color: '#ef4444',
        textAlign: 'center'
    },
    empty: {
        textAlign: 'center',
        color: '#a1a1aa',
        marginTop: 20
    }
})