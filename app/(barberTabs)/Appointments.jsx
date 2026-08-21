import { MaterialCommunityIcons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useFocusEffect } from '@react-navigation/native'
import { router } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import config from '../../config'
import apiClient from '../../lib/apiClient'
import SafeScreen from '../components/SafeScreen'

export default function Appointments() {
    const [activeTab, setActiveTab] = useState('appointments')
    const [barberId, setBarberId] = useState('')

    // Appointments State
    const [appointmentsLoading, setAppointmentsLoading] = useState(false)

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
            loadTodayAppointments()
            loadFutureAppointments()
        }
    }, [barberId, loadWorkingHours, loadDayOffs, loadTodayAppointments, loadFutureAppointments])

    useFocusEffect(
        React.useCallback(() => {
            if (barberId) {
                loadWorkingHours()
                loadDayOffs()
                loadTodayAppointments()
                loadFutureAppointments()
            }
        }, [barberId, loadWorkingHours, loadDayOffs, loadTodayAppointments, loadFutureAppointments])
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


    const loadAppointmentsByType = useCallback(async (type) => {
        try {
            console.log(`🌐 Fetching appointments for type: ${type}, barber: ${barberId}`)
            setAppointmentsLoading(true)
            const response = await apiClient.get(`${config.BASE_URL}/appointments/barber/customers?type=${type}`)
            console.log(`📡 API Response status: ${response.status}`)

            if (response.ok) {
                const data = await response.json()
                console.log(`✅ API Response data:`, data)

                // חלץ את כל התורים מהמבנה החדש
                let allAppointments = []
                if (data.customers && Array.isArray(data.customers)) {
                    data.customers.forEach(customerData => {
                        if (customerData.appointments && Array.isArray(customerData.appointments)) {
                            allAppointments = allAppointments.concat(customerData.appointments)
                        }
                    })
                }

                console.log(`📋 Extracted appointments: ${allAppointments.length}`)
                return allAppointments
            } else {
                console.error('❌ Error loading appointments:', response.status)
                return []
            }
        } catch (error) {
            console.error('❌ Error loading appointments:', error)
            return []
        } finally {
            setAppointmentsLoading(false)
        }
    }, [barberId])

    const loadWorkingHours = useCallback(async () => {
        try {
            if (!barberId) return
            setWorkingHoursLoading(true)
            const response = await apiClient.get(`${config.BASE_URL}/working-hours/barber/${barberId}`)

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
            if (!barberId) {
                Alert.alert('שגיאה', 'לא זוהה מזהה ספר')
                return
            }
            const workingHoursArray = Object.values(workingHours)
            const response = await apiClient.post(`${config.BASE_URL}/working-hours/barber/${barberId}`, {
                workingHours: workingHoursArray
            })

            if (response.ok) {
                Alert.alert('הצלחה', 'שעות העבודה נשמרו בהצלחה')
            } else {
                const errorData = await response.json().catch(() => ({}))
                const errorMsg = errorData.error || errorData.message || `שגיאה (${response.status})`
                throw new Error(errorMsg)
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
        const formatted = date.toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        return formatted
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

    // State for filtered appointments
    const [todayAppointments, setTodayAppointments] = useState([])
    const [futureAppointments, setFutureAppointments] = useState([])

    // State for reschedule functionality
    const [showRescheduleModal, setShowRescheduleModal] = useState(false)
    const [selectedAppointment, setSelectedAppointment] = useState(null)
    const [selectedNewTime, setSelectedNewTime] = useState('')
    const [availableTimes, setAvailableTimes] = useState([])
    const [loadingAvailableTimes, setLoadingAvailableTimes] = useState(false)
    const [showPastDayOffs, setShowPastDayOffs] = useState(false)

    // State for specific day override of working hours
    const [showOverrideModal, setShowOverrideModal] = useState(false)
    const [overrideDate, setOverrideDate] = useState(new Date())
    const [showOverrideDatePicker, setShowOverrideDatePicker] = useState(false)
    const [overrideIsWorking, setOverrideIsWorking] = useState(true)
    const [overrideStartTime, setOverrideStartTime] = useState('09:00')
    const [overrideEndTime, setOverrideEndTime] = useState('17:00')
    const [overrideBreakStartTime, setOverrideBreakStartTime] = useState('12:00')
    const [overrideBreakEndTime, setOverrideBreakEndTime] = useState('13:00')
    const [showOverrideStartPicker, setShowOverrideStartPicker] = useState(false)
    const [showOverrideEndPicker, setShowOverrideEndPicker] = useState(false)
    const [showOverrideBreakStartPicker, setShowOverrideBreakStartPicker] = useState(false)
    const [showOverrideBreakEndPicker, setShowOverrideBreakEndPicker] = useState(false)
    const [savingOverride, setSavingOverride] = useState(false)

    const onOverrideTimePicked = (setter, close) => (event, selectedTime) => {
        close(false)
        if (selectedTime) {
            const timeString = selectedTime.toTimeString().substring(0, 5)
            setter(timeString)
        }
    }

    const onOverrideDatePicked = (event, selectedDate) => {
        setShowOverrideDatePicker(false)
        if (selectedDate) {
            // Normalize to local date without time offset when sending later
            setOverrideDate(selectedDate)
        }
    }

    const saveSpecificDayOverride = async () => {
        try {
            if (!barberId) {
                Alert.alert('שגיאה', 'לא נמצא מזהה ספר')
                return
            }
            if (overrideIsWorking && overrideStartTime >= overrideEndTime) {
                Alert.alert('שגיאה', 'שעת הסיום חייבת להיות אחרי שעת ההתחלה')
                return
            }

            setSavingOverride(true)

            const dateString = overrideDate.toISOString().split('T')[0]
            const dayOfWeek = overrideDate.getDay()

            // אותה לוגיקה כמו saveWorkingHours: שולחים מערך בשם workingHours
            const workingHoursArray = [
                {
                    dayOfWeek,
                    date: dateString,
                    isWorking: overrideIsWorking,
                    startTime: overrideIsWorking ? overrideStartTime : null,
                    endTime: overrideIsWorking ? overrideEndTime : null,
                    breakStartTime: overrideIsWorking ? overrideBreakStartTime : null,
                    breakEndTime: overrideIsWorking ? overrideBreakEndTime : null
                }
            ]

            const response = await apiClient.post(`${config.BASE_URL}/working-hours/barber/${barberId}`, {
                workingHours: workingHoursArray
            })
            if (response.ok) {
                Alert.alert('הצלחה', 'שעות העבודה ליום הנבחר נשמרו')
                setShowOverrideModal(false)
                // רענון שעות העבודה לאחר שמירה
                loadWorkingHours()
            } else {
                let message = 'לא ניתן לשמור את שינוי שעות היום'
                try {
                    const err = await response.json()
                    message = err.error || message
                } catch { }
                Alert.alert('שגיאה', message)
            }
        } catch (error) {
            console.error('Error saving specific day override:', error)
            Alert.alert('שגיאה', 'אירעה שגיאה בעת שמירת שינוי שעות היום')
        } finally {
            setSavingOverride(false)
        }
    }

    // פונקציה לסינון ימי חופש
    const getFilteredDayOffs = useCallback(() => {
        if (showPastDayOffs) {
            return dayOffs // הצג את כל ימי החופש
        } else {
            // הצג רק ימי חופש עתידיים
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            return dayOffs.filter(dayOff => {
                const dayOffDate = new Date(dayOff.date)
                return dayOffDate >= today
            })
        }
    }, [dayOffs, showPastDayOffs])

    // פונקציות עזר לעיבוד התורים
    const loadTodayAppointments = useCallback(async () => {
        const appointments = await loadAppointmentsByType('today')

        // מיין את התורים של היום לפי שעת התחלה
        const sortedAppointments = appointments.sort((a, b) => {
            const timeA = a.startTime || '00:00'
            const timeB = b.startTime || '00:00'
            return timeA.localeCompare(timeB)
        })



        setTodayAppointments(sortedAppointments)
    }, [loadAppointmentsByType])

    const loadFutureAppointments = useCallback(async () => {
        console.log('🔄 Loading future appointments...')

        // יצור תאריך של היום בצורה יותר מדויקת
        const today = new Date()
        const todayString = today.toISOString().split('T')[0]
        console.log('📅 Today date:', todayString)
        console.log('📅 Today full date:', today.toISOString())

        // בדיקה נוספת - תאריך מקומי
        const localToday = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD format
        console.log('📅 Local today:', localToday)

        // קבל את כל התורים (לא רק future) כדי שנוכל לסנן בצד הלקוח
        const appointments = await loadAppointmentsByType('all')
        console.log('📋 All appointments from API:', appointments?.length || 0)

        const futureApps = appointments.filter(appointment => {
            // המר את תאריך התור לתאריך JavaScript
            const appointmentDate = new Date(appointment.date)
            const appointmentDateString = appointmentDate.toISOString().split('T')[0]

            // בדוק אם התור הוא מחר או אחר כך
            const isFuture = appointmentDateString > localToday

            // בדיקה נוספת - אולי התאריך מגיע בפורמט שונה
            const appointmentDateOnly = appointment.date.split('T')[0]
            const isFutureAlt = appointmentDateOnly > localToday


            return isFuture || isFutureAlt
        })

        console.log('🎯 Filtered future appointments:', futureApps.length)

        // מיין את התורים העתידיים לפי תאריך ואז לפי שעה
        const sortedFutureApps = futureApps.sort((a, b) => {
            // קודם לפי תאריך
            const dateA = new Date(a.date)
            const dateB = new Date(b.date)

            if (dateA.getTime() !== dateB.getTime()) {
                return dateA.getTime() - dateB.getTime()
            }

            // אם אותו תאריך, מיין לפי שעה
            const timeA = a.startTime || '00:00'
            const timeB = b.startTime || '00:00'
            return timeA.localeCompare(timeB)
        })

        console.log('📋 Future appointments details (sorted):', sortedFutureApps.map(apt => ({
            id: apt._id,
            date: apt.date,
            time: apt.startTime,
            customer: `${apt.customer?.firstName} ${apt.customer?.lastName}`,
            fullAppointment: apt // לוג של כל התור
        })))

        setFutureAppointments(sortedFutureApps)
    }, [loadAppointmentsByType])

    // פונקציות לשינוי שעת התור
    const openRescheduleModal = useCallback((appointment) => {
        setSelectedAppointment(appointment)
        setShowRescheduleModal(true)
        generateAvailableTimes(appointment)
    }, [generateAvailableTimes])

    const generateAvailableTimes = useCallback(async (appointment) => {
        console.log('🔄 Loading available times for appointment:', appointment._id, 'on date:', appointment.date)
        setLoadingAvailableTimes(true)
        setSelectedNewTime('') // מאפס את הבחירה הקודמת

        try {
            const appointmentDate = new Date(appointment.date).toISOString().split('T')[0]
            console.log('📅 Fetching slots for date:', appointmentDate, 'barber:', barberId)
            console.log('🔍 BarberId type:', typeof barberId, 'value:', barberId)

            // קבלת השעות הפנויות מהבקנד
            const query = new URLSearchParams({
                barberId: barberId,
                date: appointmentDate,
            }).toString()

            const response = await apiClient.get(`${config.BASE_URL}/appointments/slots?${query}`)
            if (response.ok) {
                const data = await response.json()
                console.log('📡 Full API Response:', JSON.stringify(data, null, 2))
                console.log('✅ Received slots:', data.slots)


                // מסנן את השעה הנוכחית של התור ומסיר כפילויות
                const slots = Array.isArray(data.slots) ? data.slots : []

                // חילוץ רק את startTime מהאובייקטים
                const startTimes = slots.map(slot => slot.startTime)
                console.log('🔍 Extracted startTimes:', startTimes)

                const uniqueSlots = [...new Set(startTimes)] // הסרת כפילויות
                console.log('🔍 Unique slots after deduplication:', uniqueSlots)

                const availableTimes = uniqueSlots.filter(time => time !== appointment.startTime)
                console.log('🎯 Available times after filtering:', availableTimes)

                setAvailableTimes(availableTimes)
            } else {
                // אם הבקנד לא מחזיר נתונים
                console.log('❌ Failed to get available times')
                console.log('❌ Response status:', response.status)
                console.log('❌ Response statusText:', response.statusText)
                const errorData = await response.text()
                console.log('❌ Error response:', errorData)
                setAvailableTimes([])
            }
        } catch (error) {
            console.error('❌ Error getting available times:', error)
            setAvailableTimes([])
        } finally {
            setLoadingAvailableTimes(false)
        }
    }, [barberId])


    const rescheduleAppointment = useCallback(async () => {
        if (!selectedAppointment || !selectedNewTime) return

        try {
            const url = `${config.BASE_URL}/appointments/${selectedAppointment._id}/reschedule`
            const response = await apiClient.put(url, {
                newStartTime: selectedNewTime
            })

            if (response.ok) {
                Alert.alert('הצלחה', 'שעת התור שונתה בהצלחה')
                setShowRescheduleModal(false)
                setSelectedAppointment(null)
                setSelectedNewTime('')
                // רענון התורים
                loadTodayAppointments()
                loadFutureAppointments()
            } else {
                Alert.alert('שגיאה', 'לא ניתן לשנות את שעת התור')
            }
        } catch (error) {
            console.error('Error rescheduling appointment:', error)
            Alert.alert('שגיאה', 'אירעה שגיאה בעת שינוי שעת התור')
        }
    }, [selectedAppointment, selectedNewTime, loadTodayAppointments, loadFutureAppointments])

    const cancelAppointment = (appointmentId) => {
        Alert.alert(
            'ביטול תור',
            'האם אתה בטוח שברצונך לבטל את התור?',
            [
                { text: 'ביטול', style: 'cancel' },
                {
                    text: 'אישור',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const url = `${config.BASE_URL}/appointments/${appointmentId}`
                            const response = await apiClient.delete(url)
                            if (response.ok) {
                                Alert.alert('הצלחה', 'התור בוטל בהצלחה')
                                loadTodayAppointments()
                                loadFutureAppointments()
                            } else {
                                console.error('❌ Error canceling appointment:', response.status)
                                Alert.alert('שגיאה', 'לא ניתן לבטל את התור')
                            }
                        } catch (error) {
                            console.error('❌ Error canceling appointment:', error)
                            Alert.alert('שגיאה', 'אירעה שגיאה בביטול התור')
                        }
                    }
                }
            ]
        )
    }

    const confirmAppointment = async (appointmentId) => {
        try {
            const response = await apiClient.put(`/appointments/${appointmentId}/confirm`)
            if (response.ok) {
                Alert.alert('הצלחה', 'התור אושר בהצלחה')
                // loadAppointments() // רענון הנתונים
                loadTodayAppointments()
                loadFutureAppointments()
            } else {
                Alert.alert('שגיאה', 'לא ניתן לאשר את התור')
            }
        } catch (error) {
            console.error('Error confirming appointment:', error)
            Alert.alert('שגיאה', 'אירעה שגיאה באישור התור')
        }
    }

    return (
        <SafeScreen backgroundColor="#f8fafc">
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
                            {/* תורים היום */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>תורים היום</Text>
                                {appointmentsLoading ? (
                                    <View style={styles.loadingState}>
                                        <ActivityIndicator size="large" color="#3b82f6" />
                                        <Text style={styles.loadingText}>טוען תורים...</Text>
                                    </View>
                                ) : todayAppointments.length === 0 ? (
                                    <View style={styles.emptyState}>
                                        <MaterialCommunityIcons name="calendar-check" size={48} color="#9ca3af" />
                                        <Text style={styles.emptyText}>אין תורים היום</Text>
                                        <Text style={styles.emptySubtext}>התורים יופיעו כאן כשהלקוחות יקבעו תורים</Text>
                                    </View>
                                ) : (
                                    <View style={styles.appointmentsList}>
                                        {todayAppointments.map((appointment) => (
                                            <View key={appointment._id} style={styles.appointmentCard}>
                                                <View style={styles.appointmentHeader}>
                                                    <Text style={styles.appointmentTime}>{appointment.startTime}</Text>
                                                    <View style={[styles.statusBadge, { backgroundColor: '#10b981' }]}>
                                                        <Text style={styles.statusText}>מאושר</Text>
                                                    </View>
                                                </View>
                                                <View style={styles.appointmentDetails}>
                                                    <Text style={styles.customerName}>
                                                        {appointment.customer?.firstName} {appointment.customer?.lastName}
                                                    </Text>
                                                    <Text style={styles.serviceText}>שירות: {appointment.service?.name}</Text>
                                                    <Text style={styles.priceText}>מחיר: ₪{appointment.totalPrice}</Text>
                                                    <Text style={styles.durationText}>משך: {appointment.service?.durationMinutes} דקות</Text>
                                                    {!!appointment.notes && (
                                                        <Text style={styles.notesText}>הערות: {appointment.notes}</Text>
                                                    )}
                                                </View>

                                                {/* כפתורי פעולה */}
                                                <View style={styles.appointmentActions}>
                                                    {appointment.status === 'pending' && (
                                                        <TouchableOpacity
                                                            style={[styles.actionButton, styles.confirmButton]}
                                                            onPress={() => confirmAppointment(appointment._id)}
                                                        >
                                                            <MaterialCommunityIcons name="check" size={16} color="#ffffff" />
                                                            <Text style={styles.actionButtonText}>אשר</Text>
                                                        </TouchableOpacity>
                                                    )}

                                                    {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                                                        <>
                                                            <TouchableOpacity
                                                                style={[styles.actionButton, styles.rescheduleButton]}
                                                                onPress={() => openRescheduleModal(appointment)}
                                                            >
                                                                <MaterialCommunityIcons name="clock-edit" size={16} color="#ffffff" />
                                                                <Text style={styles.actionButtonText}>שנה שעה</Text>
                                                            </TouchableOpacity>

                                                            <TouchableOpacity
                                                                style={[styles.actionButton, styles.cancelButton]}
                                                                onPress={() => cancelAppointment(appointment._id)}
                                                            >
                                                                <MaterialCommunityIcons name="close" size={16} color="#ffffff" />
                                                                <Text style={styles.actionButtonText}>בטל</Text>
                                                            </TouchableOpacity>
                                                        </>
                                                    )}
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>

                            {/* תורים עתידיים */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>תורים עתידיים</Text>
                                {appointmentsLoading ? (
                                    <View style={styles.loadingState}>
                                        <ActivityIndicator size="large" color="#3b82f6" />
                                        <Text style={styles.loadingText}>טוען תורים...</Text>
                                    </View>
                                ) : futureAppointments.length === 0 ? (
                                    <View style={styles.emptyState}>
                                        <MaterialCommunityIcons name="calendar-clock" size={48} color="#9ca3af" />
                                        <Text style={styles.emptyText}>אין תורים עתידיים</Text>
                                        <Text style={styles.emptySubtext}>התורים העתידיים יופיעו כאן</Text>
                                    </View>
                                ) : (
                                    <View style={styles.appointmentsList}>
                                        {futureAppointments.map((appointment) => (
                                            <View key={appointment._id} style={styles.appointmentCard}>
                                                <View style={styles.appointmentHeader}>
                                                    <View style={styles.dateTimeInfo}>
                                                        <Text style={styles.appointmentDate}>{formatDate(appointment.date)}</Text>
                                                        <Text style={styles.appointmentTime}>{appointment.startTime}</Text>
                                                    </View>
                                                    <View style={[styles.statusBadge, { backgroundColor: '#10b981' }]}>
                                                        <Text style={styles.statusText}>מאושר</Text>
                                                    </View>
                                                </View>
                                                <View style={styles.appointmentDetails}>
                                                    <Text style={styles.customerName}>
                                                        {appointment.customer?.firstName} {appointment.customer?.lastName}
                                                    </Text>
                                                    <Text style={styles.serviceText}>שירות: {appointment.service?.name}</Text>
                                                    <Text style={styles.priceText}>מחיר: ₪{appointment.totalPrice}</Text>
                                                    <Text style={styles.durationText}>משך: {appointment.service?.durationMinutes} דקות</Text>
                                                    {!!appointment.notes && (
                                                        <Text style={styles.notesText}>הערות: {appointment.notes}</Text>
                                                    )}
                                                </View>

                                                {/* כפתורי פעולה */}
                                                <View style={styles.appointmentActions}>
                                                    {appointment.status === 'pending' && (
                                                        <TouchableOpacity
                                                            style={[styles.actionButton, styles.confirmButton]}
                                                            onPress={() => confirmAppointment(appointment._id)}
                                                        >
                                                            <MaterialCommunityIcons name="check" size={16} color="#ffffff" />
                                                            <Text style={styles.actionButtonText}>אשר</Text>
                                                        </TouchableOpacity>
                                                    )}

                                                    {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                                                        <>
                                                            <TouchableOpacity
                                                                style={[styles.actionButton, styles.rescheduleButton]}
                                                                onPress={() => openRescheduleModal(appointment)}
                                                            >
                                                                <MaterialCommunityIcons name="clock-edit" size={16} color="#ffffff" />
                                                                <Text style={styles.actionButtonText}>שנה שעה</Text>
                                                            </TouchableOpacity>

                                                            <TouchableOpacity
                                                                style={[styles.actionButton, styles.cancelButton]}
                                                                onPress={() => cancelAppointment(appointment._id)}
                                                            >
                                                                <MaterialCommunityIcons name="close" size={16} color="#ffffff" />
                                                                <Text style={styles.actionButtonText}>בטל</Text>
                                                            </TouchableOpacity>
                                                        </>
                                                    )}
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {activeTab === 'workingHours' && (
                        <View style={styles.tabContent}>
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>שעות עבודה שבועיות</Text>
                                    <View style={styles.headerButtons}>
                                        <Pressable
                                            style={styles.addButton}
                                            onPress={() => setShowOverrideModal(true)}
                                        >
                                            <MaterialCommunityIcons name="calendar-edit" size={16} color="#ffffff" />
                                            <Text style={styles.addButtonText}>שנה יום ספציפי</Text>
                                        </Pressable>
                                    </View>
                                </View>

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
                                    <View style={styles.headerButtons}>
                                        <Pressable
                                            style={[styles.filterButton, showPastDayOffs && styles.activeFilterButton]}
                                            onPress={() => setShowPastDayOffs(!showPastDayOffs)}
                                        >
                                            <MaterialCommunityIcons
                                                name="filter"
                                                size={16}
                                                color={showPastDayOffs ? '#ffffff' : '#3b82f6'}
                                            />
                                            <Text style={[styles.filterButtonText, showPastDayOffs && styles.activeFilterButtonText]}>
                                                {showPastDayOffs ? 'הסתר עבר' : 'הצג עבר'}
                                            </Text>
                                        </Pressable>
                                        <Pressable
                                            style={styles.addButton}
                                            onPress={() => router.push('/addDayOff')}
                                        >
                                            <MaterialCommunityIcons name="plus" size={16} color="#ffffff" />
                                            <Text style={styles.addButtonText}>הוסף</Text>
                                        </Pressable>
                                    </View>
                                </View>

                                {dayOffsLoading ? (
                                    <View style={styles.loadingState}>
                                        <ActivityIndicator size="large" color="#3b82f6" />
                                        <Text style={styles.loadingText}>טוען ימי חופש...</Text>
                                    </View>
                                ) : getFilteredDayOffs().length === 0 ? (
                                    <View style={styles.emptyState}>
                                        <MaterialCommunityIcons name="calendar-remove" size={48} color="#9ca3af" />
                                        <Text style={styles.emptyText}>
                                            {showPastDayOffs ? 'אין ימי חופש עתידיים' : 'אין ימי חופש מוגדרים'}
                                        </Text>
                                        <Text style={styles.emptySubtext}>
                                            {showPastDayOffs ? 'כל ימי החופש כבר עברו' : 'לחץ על "הוסף" כדי להוסיף יום חופש'}
                                        </Text>
                                    </View>
                                ) : (
                                    getFilteredDayOffs().map((dayOff) => (
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

            {/* מודל לשינוי שעת התור */}
            <Modal
                visible={showRescheduleModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowRescheduleModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>שנה שעת תור</Text>
                            <TouchableOpacity
                                onPress={() => setShowRescheduleModal(false)}
                                style={styles.modalCloseButton}
                            >
                                <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        {selectedAppointment && (
                            <View style={styles.appointmentInfo}>
                                <Text style={styles.customerInfo}>
                                    לקוח: {selectedAppointment.customer?.firstName} {selectedAppointment.customer?.lastName}
                                </Text>
                                <Text style={styles.serviceInfo}>
                                    שירות: {selectedAppointment.service?.name}
                                </Text>
                                <Text style={styles.currentTimeInfo}>
                                    שעה נוכחית: {selectedAppointment.startTime}
                                </Text>
                            </View>
                        )}

                        <Text style={styles.timeSelectionTitle}>בחר שעה חדשה:</Text>
                        {loadingAvailableTimes ? (
                            <View style={styles.loadingTimesContainer}>
                                <ActivityIndicator size="small" color="#3b82f6" />
                                <Text style={styles.loadingTimesText}>טוען שעות פנויות...</Text>
                            </View>
                        ) : availableTimes.length === 0 ? (
                            <View style={styles.noTimesContainer}>
                                <Text style={styles.noTimesText}>אין שעות פנויות זמינות</Text>
                            </View>
                        ) : (
                            <ScrollView style={styles.timeSelectionContainer} showsVerticalScrollIndicator={false}>
                                <View style={styles.timeGrid}>
                                    {availableTimes.map((time, index) => (
                                        <TouchableOpacity
                                            key={`${time}-${index}`}
                                            style={[
                                                styles.timeOption,
                                                selectedNewTime === time && styles.selectedTimeOption
                                            ]}
                                            onPress={() => setSelectedNewTime(time)}
                                        >
                                            <Text style={[
                                                styles.timeOptionText,
                                                selectedNewTime === time && styles.selectedTimeOptionText
                                            ]}>
                                                {time}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        )}

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelModalButton]}
                                onPress={() => setShowRescheduleModal(false)}
                            >
                                <Text style={styles.cancelModalButtonText}>ביטול</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    styles.confirmModalButton,
                                    !selectedNewTime && styles.disabledButton
                                ]}
                                onPress={rescheduleAppointment}
                                disabled={!selectedNewTime}
                            >
                                <Text style={styles.confirmModalButtonText}>שנה שעה</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* מודל לשינוי שעות ליום ספציפי */}
            <Modal
                visible={showOverrideModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowOverrideModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>שינוי שעות ליום מסוים</Text>
                            <TouchableOpacity onPress={() => setShowOverrideModal(false)} style={styles.modalCloseButton}>
                                <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <View style={{ gap: 12 }}>
                            <View style={{ gap: 8 }}>
                                <Text style={styles.timeSelectionTitle}>בחר תאריך</Text>
                                <Pressable
                                    style={styles.timeButton}
                                    onPress={() => setShowOverrideDatePicker(true)}
                                >
                                    <MaterialCommunityIcons name="calendar" size={16} color="#6b7280" />
                                    <Text style={styles.timeButtonText}>{overrideDate.toLocaleDateString('he-IL')}</Text>
                                </Pressable>
                                {showOverrideDatePicker && (
                                    <DateTimePicker
                                        value={overrideDate}
                                        mode="date"
                                        display="default"
                                        onChange={onOverrideDatePicked}
                                        minimumDate={new Date()}
                                    />
                                )}
                            </View>

                            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Text style={styles.timeLabel}>עובד ביום זה?</Text>
                                <Switch
                                    value={overrideIsWorking}
                                    onValueChange={setOverrideIsWorking}
                                    trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
                                    thumbColor={overrideIsWorking ? '#ffffff' : '#f3f4f6'}
                                />
                            </View>

                            {overrideIsWorking && (
                                <View style={styles.timeInputs}>
                                    <View style={styles.timeRow}>
                                        <Text style={styles.timeLabel}>שעת התחלה:</Text>
                                        <Pressable style={styles.timeButton} onPress={() => setShowOverrideStartPicker(true)}>
                                            <Text style={styles.timeButtonText}>{overrideStartTime}</Text>
                                            <MaterialCommunityIcons name="clock-outline" size={16} color="#6b7280" />
                                        </Pressable>
                                    </View>
                                    <View style={styles.timeRow}>
                                        <Text style={styles.timeLabel}>שעת סיום:</Text>
                                        <Pressable style={styles.timeButton} onPress={() => setShowOverrideEndPicker(true)}>
                                            <Text style={styles.timeButtonText}>{overrideEndTime}</Text>
                                            <MaterialCommunityIcons name="clock-outline" size={16} color="#6b7280" />
                                        </Pressable>
                                    </View>
                                    <View style={styles.timeRow}>
                                        <Text style={styles.timeLabel}>הפסקה מ:</Text>
                                        <Pressable style={styles.timeButton} onPress={() => setShowOverrideBreakStartPicker(true)}>
                                            <Text style={styles.timeButtonText}>{overrideBreakStartTime}</Text>
                                            <MaterialCommunityIcons name="clock-outline" size={16} color="#6b7280" />
                                        </Pressable>
                                    </View>
                                    <View style={styles.timeRow}>
                                        <Text style={styles.timeLabel}>הפסקה עד:</Text>
                                        <Pressable style={styles.timeButton} onPress={() => setShowOverrideBreakEndPicker(true)}>
                                            <Text style={styles.timeButtonText}>{overrideBreakEndTime}</Text>
                                            <MaterialCommunityIcons name="clock-outline" size={16} color="#6b7280" />
                                        </Pressable>
                                    </View>
                                </View>
                            )}

                            {showOverrideStartPicker && (
                                <DateTimePicker
                                    value={getTimeFromString(overrideStartTime)}
                                    mode="time"
                                    display="spinner"
                                    onChange={onOverrideTimePicked(setOverrideStartTime, setShowOverrideStartPicker)}
                                />
                            )}
                            {showOverrideEndPicker && (
                                <DateTimePicker
                                    value={getTimeFromString(overrideEndTime)}
                                    mode="time"
                                    display="spinner"
                                    onChange={onOverrideTimePicked(setOverrideEndTime, setShowOverrideEndPicker)}
                                />
                            )}
                            {showOverrideBreakStartPicker && (
                                <DateTimePicker
                                    value={getTimeFromString(overrideBreakStartTime)}
                                    mode="time"
                                    display="spinner"
                                    onChange={onOverrideTimePicked(setOverrideBreakStartTime, setShowOverrideBreakStartPicker)}
                                />
                            )}
                            {showOverrideBreakEndPicker && (
                                <DateTimePicker
                                    value={getTimeFromString(overrideBreakEndTime)}
                                    mode="time"
                                    display="spinner"
                                    onChange={onOverrideTimePicked(setOverrideBreakEndTime, setShowOverrideBreakEndPicker)}
                                />
                            )}

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelModalButton]}
                                    onPress={() => setShowOverrideModal(false)}
                                >
                                    <Text style={styles.cancelModalButtonText}>ביטול</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.confirmModalButton, savingOverride && styles.disabledButton]}
                                    onPress={saveSpecificDayOverride}
                                    disabled={savingOverride}
                                >
                                    <Text style={styles.confirmModalButtonText}>{savingOverride ? 'שומר...' : 'שמור'}</Text>
                                </TouchableOpacity>
                            </View>
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
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#3b82f6',
        backgroundColor: 'transparent',
    },
    activeFilterButton: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    filterButtonText: {
        color: '#3b82f6',
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 4,
    },
    activeFilterButtonText: {
        color: '#ffffff',
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
    },
    appointmentsList: {
        padding: 16,
        gap: 12
    },
    appointmentCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    appointmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    dateTimeInfo: {
        alignItems: 'flex-end'
    },
    appointmentDate: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 2
    },
    appointmentTime: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827'
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
    appointmentDetails: {
        gap: 6
    },
    customerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        textAlign: 'right'
    },
    serviceText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'right'
    },
    priceText: {
        fontSize: 14,
        color: '#10b981',
        fontWeight: '600',
        textAlign: 'right'
    },
    durationText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'right'
    },
    notesText: {
        fontSize: 14,
        color: '#6b7280',
        fontStyle: 'italic',
        textAlign: 'right'
    },
    appointmentActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 12
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        gap: 4
    },
    confirmButton: {
        backgroundColor: '#10b981'
    },
    cancelButton: {
        backgroundColor: '#ef4444'
    },
    rescheduleButton: {
        backgroundColor: '#f59e0b'
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#ffffff'
    },

    // Modal styles
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
        padding: 20,
        width: '100%',
        maxHeight: '80%'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1f2937'
    },
    modalCloseButton: {
        padding: 4
    },
    appointmentInfo: {
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20
    },
    customerInfo: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 4
    },
    serviceInfo: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 4
    },
    currentTimeInfo: {
        fontSize: 14,
        color: '#6b7280'
    },
    timeSelectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 12
    },
    loadingTimesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20
    },
    loadingTimesText: {
        fontSize: 14,
        color: '#6b7280',
        marginLeft: 8
    },
    noTimesContainer: {
        alignItems: 'center',
        paddingVertical: 20
    },
    noTimesText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center'
    },
    timeSelectionContainer: {
        maxHeight: 200,
        marginBottom: 20
    },
    timeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    timeOption: {
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
        marginBottom: 8,
        minWidth: 60,
        alignItems: 'center'
    },
    selectedTimeOption: {
        backgroundColor: '#3b82f6'
    },
    timeOptionText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280'
    },
    selectedTimeOptionText: {
        color: '#ffffff'
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center'
    },
    cancelModalButton: {
        backgroundColor: '#f3f4f6'
    },
    confirmModalButton: {
        backgroundColor: '#3b82f6'
    },
    disabledButton: {
        backgroundColor: '#d1d5db'
    },
    cancelModalButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b7280'
    },
    confirmModalButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff'
    }
})
