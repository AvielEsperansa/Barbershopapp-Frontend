import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native'
import { Calendar } from 'react-native-calendars'
import config from '../../config'
import apiClient from '../../lib/apiClient'

const STEP = {
    BARBER: 0,
    SERVICE: 1,
    DATE: 2,
    TIME: 3,
    SUMMARY: 4,
}

export default function CustomerAppointment() {
    const [step, setStep] = useState(STEP.BARBER)
    const [loading, setLoading] = useState(false)
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

    useEffect(() => {
        const fetchBarbers = async () => {
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
        }

        const init = async () => {
            setLoading(true)
            setError('')
            try {
                // Load services
                const servicesRes = await apiClient.get(`${config.BASE_URL}/services`)
                const servicesJson = await servicesRes.json()
                const servicesData = servicesJson.services || servicesJson
                setServices(Array.isArray(servicesData) ? servicesData : [])

                // Load barbers via multiple possible endpoints
                const b = await fetchBarbers()
                setBarbers(Array.isArray(b) ? b : [])

                // Load user's upcoming appointments
                await loadMyAppointments()
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to load data')
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [])

    const loadMyAppointments = async () => {
        try {
            const url = `${config.BASE_URL}/appointments/my-appointments`
            const res = await apiClient.get(url)
            const json = await res.json()
            if (!res.ok) {
                setMyAppointments([])
                return
            }
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
            const upcomingActive = (Array.isArray(list) ? list : [])
                .filter((a) => !isCanceled(a))
                .map((a) => ({ a, dayKey: toDayKey(a) }))
                .filter(({ dayKey }) => !!dayKey && dayKey >= todayKey)
                .sort((x, y) => (x.dayKey < y.dayKey ? -1 : x.dayKey > y.dayKey ? 1 : 0))
                .map(({ a }) => a)
            setMyAppointments(upcomingActive)
        } catch (_e) {
            setMyAppointments([])
        }
    }

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
            console.error('Error loading slots:', e)
            setError(e instanceof Error ? e.message : 'Failed to load available slots')
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
                textColor: isPast ? '#d1d5db' : '#111827', // צבע טקסט אפור לתאריכים בעבר
                selectedColor: '#3b82f6'
            }
        }

        if (selectedDate) {
            const k = typeof selectedDate === 'string' ? selectedDate : toDateKey(selectedDate)
            marks[k] = { ...(marks[k] || {}), selected: true, selectedColor: '#3b82f6' }
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
            const body = {
                barberId: selectedBarber._id,
                serviceId: selectedService._id,
                date: new Date(selectedDate).toISOString(),
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
                            const url = `${config.BASE_URL}/appointments/cancel/${apptId}`
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

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.headerRow}>
                {step !== STEP.BARBER && (
                    <Pressable onPress={goBackStep} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-right" size={22} color="#111827" />
                        <Text style={styles.backText}>חזרה</Text>
                    </Pressable>
                )}
                <Text style={styles.title}>קביעת פגישה</Text>
            </View>
            <Text style={styles.subtitle}>
                {step === STEP.BARBER && 'בחרו ספר'}
                {step === STEP.SERVICE && 'בחרו טיפול'}
                {step === STEP.DATE && 'בחרו תאריך'}
                {step === STEP.TIME && 'בחרו שעה'}
                {step === STEP.SUMMARY && 'סיכום ההזמנה'}
            </Text>
        </View>
    )

    const BarberCard = ({ item }) => (
        <Pressable style={[styles.card, selectedBarber?._id === item._id && styles.cardSelected]} onPress={() => onSelectBarber(item)}>
            <MaterialCommunityIcons name="account" size={28} color="#1f2937" />
            <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.firstName} {item.lastName}</Text>
                <Text style={styles.cardSubtitle}>ספר</Text>
            </View>
            <MaterialCommunityIcons name="chevron-left" size={24} color="#9ca3af" />
        </Pressable>
    )

    const ServiceCard = ({ item }) => (
        <Pressable style={[styles.card, selectedService?._id === item._id && styles.cardSelected]} onPress={() => { setSelectedService(item); setStep(STEP.DATE) }}>
            <MaterialCommunityIcons name="content-cut" size={28} color="#1f2937" />
            <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSubtitle}>{item.durationMinutes} ד׳ • ₪{item.price}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-left" size={24} color="#9ca3af" />
        </Pressable>
    )

    // Replaced date pills with a full calendar

    const SlotPill = ({ slot }) => {
        const isSelected = selectedSlot && selectedSlot.startTime === slot.startTime
        return (
            <Pressable disabled={!slot.isAvailable} onPress={() => { setSelectedSlot(slot); setStep(STEP.SUMMARY) }} style={[styles.slotPill, isSelected && styles.slotPillSelected, !slot.isAvailable && styles.slotPillDisabled]}>
                <Text style={[styles.slotPillText, !slot.isAvailable && styles.slotPillTextDisabled]}>{slot.startTime}</Text>
            </Pressable>
        )
    }

    const getSelectedDateDisplay = () => {
        if (!selectedDate) return ''
        const d = typeof selectedDate === 'string' ? new Date(selectedDate) : selectedDate
        return d instanceof Date && !isNaN(d) ? d.toLocaleDateString('he-IL') : String(selectedDate)
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

            <ScrollView contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}>
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
                        <Text style={styles.helper}>ניתן לבחור תאריכים מהיום ועד חודש קדימה</Text>
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
                                todayTextColor: '#2563eb',
                                arrowColor: '#111827',
                                textDayFontFamily: undefined,
                                textMonthFontFamily: undefined,
                                textDayHeaderFontFamily: undefined,
                                'stylesheet.calendar.header': {
                                    dayHeader: {
                                        color: '#6b7280',
                                        fontWeight: '600'
                                    }
                                }
                            }}
                            minDate={new Date().toISOString().split('T')[0]}
                            maxDate={(() => { const d = new Date(); d.setDate(d.getDate() + 29); return d.toISOString().split('T')[0] })()}
                            disableAllTouchEventsForDisabledDays={true}
                            markingType="custom"
                            firstDay={0}
                            hideExtraDays
                            disableArrowLeft={false} // מאפשר חזרה לחודשים קודמים אבל לא לבחור תאריכים בעבר
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
        backgroundColor: '#f8fafc'
    },
    header: {
        paddingTop: 24,
        paddingBottom: 8,
        paddingHorizontal: 16,
    },
    headerRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6
    },
    backButton: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 8,
        backgroundColor: '#f3f4f6'
    },
    backText: {
        color: '#111827',
        fontSize: 14,
        fontWeight: '600'
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'right'
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'right'
    },
    list: {
        padding: 16,
        gap: 12
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    cardSelected: {
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff'
    },
    cardTitle: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '600'
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#6b7280'
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'right'
    },
    datePill: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        marginRight: 10,
    },
    datePillSelected: {
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff'
    },
    datePillDisabled: {
        backgroundColor: '#fee2e2',
        borderColor: '#fecaca'
    },
    datePillText: {
        color: '#111827',
        fontSize: 13
    },
    datePillTextDisabled: {
        color: '#991b1b'
    },
    slotPill: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        marginRight: 0,
    },
    slotPillSelected: {
        borderColor: '#10b981',
        backgroundColor: '#ecfdf5'
    },
    slotPillDisabled: {
        backgroundColor: '#f3f4f6',
        borderColor: '#e5e7eb',
        opacity: 0.6
    },
    slotPillText: {
        color: '#111827',
        fontSize: 13
    },
    slotPillTextDisabled: {
        color: '#6b7280'
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
        color: '#6b7280',
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
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    summaryLabel: {
        color: '#6b7280'
    },
    summaryValue: {
        color: '#111827',
        fontWeight: '600'
    },
    notes: {
        minHeight: 80,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        padding: 10,
        textAlign: 'right'
    },
    confirmButton: {
        backgroundColor: '#10b981',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center'
    },
    confirmButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16
    },
    cancelButton: {
        backgroundColor: '#ef4444',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 8
    },
    cancelButtonText: {
        color: '#fff',
        fontWeight: '700'
    },
    sectionNext: {
        marginTop: 8,
        padding: 16,
        gap: 8,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    loading: {
        position: 'absolute',
        top: 0,
        right: 0,
        left: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.6)'
    },
    error: {
        paddingHorizontal: 16,
        paddingVertical: 8
    },
    errorText: {
        color: '#b91c1c',
        textAlign: 'center'
    },
    empty: {
        textAlign: 'center',
        color: '#6b7280',
        marginTop: 20
    }
})