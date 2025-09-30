import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'
import config from '../config'
import apiClient from '../lib/apiClient'
import SafeScreen from './components/SafeScreen'

export default function CustomerHaircuts() {
    const { customerId, customerName, customerPhone, appointmentsData } = useLocalSearchParams()
    const [appointments, setAppointments] = useState([])
    const [filteredAppointments, setFilteredAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [searchDate, setSearchDate] = useState('')

    useEffect(() => {
        // נסה להשתמש בנתונים שמועברים ישירות
        if (appointmentsData) {
            try {
                const parsedAppointments = JSON.parse(appointmentsData)
                setAppointments(parsedAppointments)
                setLoading(false)
                console.log('Using passed appointments data:', parsedAppointments)
            } catch (error) {
                console.error('Error parsing appointments data:', error)
                loadCustomerAppointments()
            }
        } else {
            loadCustomerAppointments()
        }
    }, [customerId, loadCustomerAppointments, appointmentsData])

    useEffect(() => {
        filterAppointments()
    }, [appointments, searchDate, filterAppointments])

    const filterAppointments = useCallback(() => {
        if (!searchDate.trim()) {
            setFilteredAppointments(appointments)
            return
        }

        const filtered = appointments.filter(appointment => {
            const appointmentDate = new Date(appointment.date)
            const searchDateObj = new Date(searchDate)

            // השווה רק את התאריך (ללא זמן)
            const appointmentDateOnly = appointmentDate.toISOString().split('T')[0]
            const searchDateOnly = searchDateObj.toISOString().split('T')[0]

            return appointmentDateOnly === searchDateOnly
        })

        setFilteredAppointments(filtered)
    }, [appointments, searchDate])

    const loadCustomerAppointments = useCallback(async () => {
        try {
            setLoading(true)
            console.log('Loading appointments for customer:', customerId)

            // קבל את כל הלקוחות עם התספורות שלהם
            const response = await apiClient.get(`${config.BASE_URL}/appointments/barber/customers?type=all`)
            console.log('Response status:', response.status)

            if (response.ok) {
                const data = await response.json()
                console.log('Full response data:', data)

                // מצא את הלקוח הספציפי ברשימה
                const customerData = data.customers?.find(customer =>
                    customer.customer._id === customerId
                )

                if (customerData && customerData.appointments) {
                    setAppointments(customerData.appointments)
                    console.log('Customer appointments found:', customerData.appointments.length)
                } else {
                    console.log('No appointments found for customer')
                    setAppointments([])
                }
            } else {
                const errorText = await response.text()
                console.error('API Error:', response.status, errorText)
                Alert.alert('שגיאה', `לא ניתן לטעון את היסטוריית התספורות (${response.status})`)
            }
        } catch (error) {
            console.error('Error loading customer appointments:', error)
            Alert.alert('שגיאה', 'אירעה שגיאה בטעינת היסטוריית התספורות')
        } finally {
            setLoading(false)
        }
    }, [customerId])

    const onRefresh = async () => {
        setRefreshing(true)
        await loadCustomerAppointments()
        setRefreshing(false)
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const formatTime = (timeString) => {
        return timeString
    }

    const getServiceIcon = (category) => {
        switch (category) {
            case 'תספורת':
            case 'haircut':
                return 'content-cut'
            case 'זקן':
            case 'beard':
                return 'face-man'
            case 'עיצוב':
            case 'styling':
                return 'hair-dryer'
            default:
                return 'scissors-cutting'
        }
    }

    const getServiceColor = (category) => {
        switch (category) {
            case 'תספורת':
            case 'haircut':
                return '#3b82f6'
            case 'זקן':
            case 'beard':
                return '#f59e0b'
            case 'עיצוב':
            case 'styling':
                return '#8b5cf6'
            default:
                return '#6b7280'
        }
    }

    const renderAppointmentItem = ({ item: appointment }) => (
        <View style={styles.appointmentCard}>
            <View style={styles.appointmentHeader}>
                <View style={styles.serviceInfo}>
                    <MaterialCommunityIcons
                        name={getServiceIcon(appointment.service?.category)}
                        size={24}
                        color={getServiceColor(appointment.service?.category)}
                    />
                    <View style={styles.serviceDetails}>
                        <Text style={styles.serviceName}>{appointment.service?.name}</Text>
                        <Text style={styles.serviceDescription}>{appointment.service?.description}</Text>
                    </View>
                </View>
                <View style={styles.priceContainer}>
                    <Text style={styles.priceText}>₪{appointment.totalPrice}</Text>
                </View>
            </View>

            <View style={styles.appointmentDetails}>
                <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="calendar" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>{formatDate(appointment.date)}</Text>
                </View>

                <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="clock" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>
                        {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                    </Text>
                </View>

                <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="timer" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>{appointment.service?.durationMinutes} דקות</Text>
                </View>

                {appointment.notes && (
                    <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="note-text" size={16} color="#6b7280" />
                        <Text style={styles.detailText}>{appointment.notes}</Text>
                    </View>
                )}
            </View>
        </View>
    )

    if (loading) {
        return (
            <SafeScreen backgroundColor="#f8fafc">
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={styles.loadingText}>טוען היסטוריית תספורות...</Text>
                </View>
            </SafeScreen>
        )
    }

    return (
        <SafeScreen backgroundColor="#f8fafc">
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <MaterialCommunityIcons name="arrow-right" size={24} color="#3b82f6" />
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text style={styles.title}>היסטוריית תספורות</Text>
                        <Text style={styles.customerName}>{customerName}</Text>
                    </View>
                </View>

                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{filteredAppointments.length}</Text>
                        <Text style={styles.statLabel}>
                            {searchDate ? 'תספורות בתאריך' : 'תספורות בסך הכל'}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>
                            ₪{filteredAppointments.reduce((sum, appointment) => sum + appointment.totalPrice, 0)}
                        </Text>
                        <Text style={styles.statLabel}>סכום כולל</Text>
                    </View>
                </View>

                {/* שדה חיפוש לפי תאריך */}
                <View style={styles.searchContainer}>
                    <MaterialCommunityIcons name="calendar-search" size={20} color="#6b7280" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="חפש לפי תאריך (YYYY-MM-DD)..."
                        value={searchDate}
                        onChangeText={setSearchDate}
                        textAlign="right"
                    />
                    {searchDate && (
                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={() => setSearchDate('')}
                        >
                            <MaterialCommunityIcons name="close" size={20} color="#6b7280" />
                        </TouchableOpacity>
                    )}
                </View>

                <FlatList
                    data={filteredAppointments}
                    renderItem={renderAppointmentItem}
                    keyExtractor={(item) => item._id.toString()}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="scissors-cutting" size={64} color="#d1d5db" />
                            <Text style={styles.emptyText}>
                                {searchDate ? 'לא נמצאו תספורות בתאריך זה' : 'אין תספורות רשומות'}
                            </Text>
                        </View>
                    }
                />
            </View>
        </SafeScreen>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc'
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6b7280'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb'
    },
    backButton: {
        marginRight: 12
    },
    headerInfo: {
        flex: 1
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'right'
    },
    customerName: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'right',
        marginTop: 4
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        marginTop: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        gap: 12
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#111827'
    },
    clearButton: {
        padding: 4
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginTop: 16,
        gap: 12
    },
    statItem: {
        flex: 1,
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#3b82f6'
    },
    statLabel: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
        textAlign: 'center'
    },
    listContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 100
    },
    appointmentCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    appointmentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12
    },
    serviceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1
    },
    serviceDetails: {
        marginRight: 12,
        flex: 1
    },
    serviceName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        textAlign: 'right'
    },
    serviceDescription: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'right',
        marginTop: 2
    },
    priceContainer: {
        backgroundColor: '#f0f9ff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#0ea5e9'
    },
    priceText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0ea5e9'
    },
    appointmentDetails: {
        gap: 8
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    detailText: {
        fontSize: 14,
        color: '#6b7280',
        flex: 1,
        textAlign: 'right'
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 64
    },
    emptyText: {
        fontSize: 16,
        color: '#6b7280',
        marginTop: 16,
        textAlign: 'center'
    }
})
