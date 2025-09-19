import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import apiClient from '../lib/apiClient'
import DateTimePicker from './components/DateTimePicker'
import SafeScreen from './components/SafeScreen'

export default function CustomerDetails() {
    const [customer, setCustomer] = useState(null)
    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [showRescheduleModal, setShowRescheduleModal] = useState(false)
    const [selectedAppointment, setSelectedAppointment] = useState(null)

    useEffect(() => {
        loadCustomerDetails()
    }, [])

    const loadCustomerDetails = async () => {
        try {
            setLoading(true)
            const customerId = router.params?.customerId

            if (!customerId) {
                Alert.alert('שגיאה', 'מזהה לקוח לא נמצא')
                router.back()
                return
            }

            // טוען פרטי לקוח ותורים שלו
            const customerResponse = await apiClient.get(`/barber/my-customers/${customerId}`)
            if (customerResponse.ok) {
                const customerData = await customerResponse.json()
                setCustomer(customerData.customer)
                setAppointments(customerData.appointments || [])
            } else {
                Alert.alert('שגיאה', 'לא ניתן לטעון את פרטי הלקוח')
            }

        } catch (error) {
            console.error('Error loading customer details:', error)
            Alert.alert('שגיאה', 'אירעה שגיאה בטעינת פרטי הלקוח')
        } finally {
            setLoading(false)
        }
    }

    const openWhatsApp = () => {
        if (!customer?.phone) return

        const cleanPhone = customer.phone.replace(/[^0-9]/g, '')
        const whatsappUrl = `whatsapp://send?phone=${cleanPhone}`

        Linking.canOpenURL(whatsappUrl)
            .then((supported) => {
                if (supported) {
                    return Linking.openURL(whatsappUrl)
                } else {
                    Alert.alert('שגיאה', 'WhatsApp לא מותקן במכשיר')
                }
            })
            .catch((err) => {
                console.error('Error opening WhatsApp:', err)
                Alert.alert('שגיאה', 'לא ניתן לפתוח את WhatsApp')
            })
    }

    const openRescheduleModal = (appointment) => {
        setSelectedAppointment(appointment)
        setShowRescheduleModal(true)
    }

    const rescheduleAppointment = async (newDate, newTime) => {
        if (!selectedAppointment || !newDate || !newTime) {
            Alert.alert('שגיאה', 'אנא מלא את כל השדות')
            return
        }

        try {
            const response = await apiClient.put(`/barber/my-appointments/${selectedAppointment.id}/reschedule`, {
                newDate,
                newTime
            })

            if (response.ok) {
                Alert.alert('הצלחה', 'התור שונה בהצלחה', [
                    {
                        text: 'אישור',
                        onPress: () => {
                            setShowRescheduleModal(false)
                            loadCustomerDetails() // רענון הנתונים
                        }
                    }
                ])
            } else {
                const errorData = await response.json()
                Alert.alert('שגיאה', errorData.message || 'לא ניתן לשנות את התור')
            }
        } catch (error) {
            console.error('Error rescheduling appointment:', error)
            Alert.alert('שגיאה', 'אירעה שגיאה בשינוי התור')
        }
    }

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
                            const response = await apiClient.delete(`/barber/my-appointments/${appointmentId}`)
                            if (response.ok) {
                                Alert.alert('הצלחה', 'התור בוטל בהצלחה')
                                loadCustomerDetails() // רענון הנתונים
                            } else {
                                Alert.alert('שגיאה', 'לא ניתן לבטל את התור')
                            }
                        } catch (error) {
                            console.error('Error canceling appointment:', error)
                            Alert.alert('שגיאה', 'אירעה שגיאה בביטול התור')
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

    const getAppointmentStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return '#10b981'
            case 'pending': return '#f59e0b'
            case 'cancelled': return '#ef4444'
            case 'completed': return '#6b7280'
            default: return '#6b7280'
        }
    }

    const getAppointmentStatusText = (status) => {
        switch (status) {
            case 'confirmed': return 'מאושר'
            case 'pending': return 'ממתין לאישור'
            case 'cancelled': return 'מבוטל'
            case 'completed': return 'הושלם'
            default: return 'לא ידוע'
        }
    }

    const renderAppointmentItem = ({ item: appointment }) => (
        <View style={styles.appointmentCard}>
            <View style={styles.appointmentHeader}>
                <Text style={styles.appointmentDate}>
                    {formatDate(appointment.date)} - {appointment.time}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getAppointmentStatusColor(appointment.status) }]}>
                    <Text style={styles.statusText}>
                        {getAppointmentStatusText(appointment.status)}
                    </Text>
                </View>
            </View>

            <View style={styles.appointmentDetails}>
                <Text style={styles.serviceText}>שירות: {appointment.service}</Text>
                {appointment.notes && (
                    <Text style={styles.notesText}>הערות: {appointment.notes}</Text>
                )}
            </View>

            {appointment.status === 'confirmed' && (
                <View style={styles.appointmentActions}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.rescheduleButton]}
                        onPress={() => openRescheduleModal(appointment)}
                    >
                        <MaterialCommunityIcons name="calendar-clock" size={16} color="#3b82f6" />
                        <Text style={styles.actionButtonText}>שנה תור</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.cancelButton]}
                        onPress={() => cancelAppointment(appointment.id)}
                    >
                        <MaterialCommunityIcons name="close" size={16} color="#ef4444" />
                        <Text style={styles.actionButtonText}>בטל</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    )

    if (loading) {
        return (
            <SafeScreen paddingTop={5}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={styles.loadingText}>טוען פרטי לקוח...</Text>
                </View>
            </SafeScreen>
        )
    }

    if (!customer) {
        return (
            <SafeScreen paddingTop={5}>
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={64} color="#ef4444" />
                    <Text style={styles.errorText}>לא ניתן לטעון את פרטי הלקוח</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadCustomerDetails}>
                        <Text style={styles.retryButtonText}>נסה שוב</Text>
                    </TouchableOpacity>
                </View>
            </SafeScreen>
        )
    }

    return (
        <SafeScreen paddingTop={5}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <MaterialCommunityIcons name="arrow-right" size={24} color="#3b82f6" />
                    </TouchableOpacity>
                    <Text style={styles.title}>פרטי לקוח</Text>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* פרטי לקוח */}
                    <View style={styles.customerCard}>
                        <View style={styles.customerHeader}>
                            <Text style={styles.customerName}>{customer.name}</Text>
                            <View style={styles.whatsappButton} onPress={openWhatsApp}>
                                <MaterialCommunityIcons name="whatsapp" size={24} color="#25d366" />
                            </View>
                        </View>

                        <View style={styles.customerDetails}>
                            <View style={styles.detailRow}>
                                <MaterialCommunityIcons name="phone" size={20} color="#6b7280" />
                                <Text style={styles.detailText}>{customer.phone}</Text>
                            </View>

                            {customer.email && (
                                <View style={styles.detailRow}>
                                    <MaterialCommunityIcons name="email" size={20} color="#6b7280" />
                                    <Text style={styles.detailText}>{customer.email}</Text>
                                </View>
                            )}

                            <View style={styles.detailRow}>
                                <MaterialCommunityIcons name="calendar" size={20} color="#6b7280" />
                                <Text style={styles.detailText}>
                                    {appointments.length} תורים בסך הכל
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.whatsappActionButton} onPress={openWhatsApp}>
                            <MaterialCommunityIcons name="whatsapp" size={20} color="#ffffff" />
                            <Text style={styles.whatsappButtonText}>שלח הודעה ב-WhatsApp</Text>
                        </TouchableOpacity>
                    </View>

                    {/* רשימת תורים */}
                    <View style={styles.appointmentsSection}>
                        <Text style={styles.sectionTitle}>תורים של הלקוח</Text>

                        {appointments.length > 0 ? (
                            <FlatList
                                data={appointments}
                                renderItem={renderAppointmentItem}
                                keyExtractor={(item) => item.id.toString()}
                                scrollEnabled={false}
                                showsVerticalScrollIndicator={false}
                            />
                        ) : (
                            <View style={styles.emptyAppointments}>
                                <MaterialCommunityIcons name="calendar-blank" size={48} color="#d1d5db" />
                                <Text style={styles.emptyText}>אין תורים רשומים</Text>
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* מודל שינוי תור */}
                <DateTimePicker
                    visible={showRescheduleModal}
                    onClose={() => setShowRescheduleModal(false)}
                    onConfirm={rescheduleAppointment}
                    initialDate={selectedAppointment?.date || ''}
                    initialTime={selectedAppointment?.time || ''}
                    title="שינוי תור"
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        paddingHorizontal: 32
    },
    errorText: {
        fontSize: 18,
        color: '#ef4444',
        marginTop: 16,
        textAlign: 'center'
    },
    retryButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 16
    },
    retryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600'
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
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        flex: 1,
        textAlign: 'right'
    },
    content: {
        flex: 1,
        paddingHorizontal: 16
    },
    customerCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 20,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    customerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16
    },
    customerName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        flex: 1,
        textAlign: 'right'
    },
    whatsappButton: {
        padding: 8
    },
    customerDetails: {
        gap: 12,
        marginBottom: 20
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    detailText: {
        fontSize: 16,
        color: '#6b7280',
        flex: 1,
        textAlign: 'right'
    },
    whatsappActionButton: {
        backgroundColor: '#25d366',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8
    },
    whatsappButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600'
    },
    appointmentsSection: {
        marginTop: 24
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 16,
        textAlign: 'right'
    },
    appointmentCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    appointmentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    appointmentDate: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        flex: 1,
        textAlign: 'right'
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
        marginBottom: 12
    },
    serviceText: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 4
    },
    notesText: {
        fontSize: 14,
        color: '#6b7280',
        fontStyle: 'italic'
    },
    appointmentActions: {
        flexDirection: 'row',
        gap: 8
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        gap: 4
    },
    rescheduleButton: {
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#3b82f6'
    },
    cancelButton: {
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#ef4444'
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '500'
    },
    emptyAppointments: {
        alignItems: 'center',
        paddingVertical: 32
    },
    emptyText: {
        fontSize: 16,
        color: '#6b7280',
        marginTop: 8,
        textAlign: 'center'
    },
})
