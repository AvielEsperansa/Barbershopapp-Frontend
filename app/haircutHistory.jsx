import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native'
import config from '../config'
import apiClient from '../lib/apiClient'
import SafeScreen from './components/SafeScreen'

export default function HaircutHistory() {
    const [appointments, setAppointments] = useState([])
    const [ratings, setRatings] = useState({}) // appointmentId -> rating object
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showRatingModal, setShowRatingModal] = useState(false)
    const [selectedAppointmentId, setSelectedAppointmentId] = useState('')
    const [ratingValue, setRatingValue] = useState(5)
    const [reviewText, setReviewText] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [editingRating, setEditingRating] = useState(null) // rating object for editing

    useEffect(() => {
        fetchHaircutHistory()
        fetchRatings()
    }, [])

    const fetchHaircutHistory = async () => {
        try {
            setLoading(true)
            setError('')

            console.log('🔍 Fetching customer haircut history')

            // נקבל את היסטוריית התספורות של הלקוח
            const response = await apiClient.get(`${config.BASE_URL}/users/appointments/past`)

            if (response.ok) {
                const data = await response.json()
                console.log('✅ Haircut history received:', data)

                // נסנן רק תורים בעבר
                const todayKey = new Date().toISOString().split('T')[0]
                const pastAppointments = (data.appointments || []).filter(appointment => {
                    const appointmentDate = new Date(appointment.date).toISOString().split('T')[0]
                    return appointmentDate < todayKey
                })

                setAppointments(pastAppointments)
            } else {
                console.error('❌ Failed to fetch haircut history:', response.status)
                const errorText = await response.text()
                console.error('❌ Error response:', errorText)
                throw new Error('לא ניתן לטעון היסטוריית תספורות')
            }
        } catch (error) {
            console.error('❌ Error fetching haircut history:', error)
            setError(error.message || 'אירעה שגיאה בטעינת היסטוריית התספורות')
        } finally {
            setLoading(false)
        }
    }

    const fetchRatings = async () => {
        try {
            const response = await apiClient.get(`${config.BASE_URL}/ratings/user`)

            if (response.ok) {
                const data = await response.json()
                const ratingsMap = {}

                // בדיקה של המבנה - יכול להיות data.ratings או data ישירות
                const ratingsArray = data.ratings || data || []

                if (Array.isArray(ratingsArray)) {
                    ratingsArray.forEach((rating, index) => {
                        console.log(`⭐ Rating ${index}:`, rating)
                        // appointment הוא אובייקט, צריך לחלץ את ה-_id
                        const appointmentId = rating.appointment?._id || rating.appointmentId || rating._id
                        if (appointmentId) {
                            ratingsMap[appointmentId] = rating
                        } else {
                            console.log(`❌ No appointment ID found for rating ${index}`)
                        }
                    })
                } else {
                    console.log('❌ Ratings is not an array:', typeof ratingsArray)
                }
                setRatings(ratingsMap)
            } else {
                console.error('❌ Failed to fetch ratings:', response.status)
                const errorText = await response.text()
                console.error('❌ Error response:', errorText)
            }
        } catch (error) {
            console.error('❌ Error fetching ratings:', error)
        }
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const openRatingForAppointment = (appointmentId) => {
        setSelectedAppointmentId(appointmentId)
        setRatingValue(5)
        setReviewText('')
        setEditingRating(null)
        setShowRatingModal(true)
    }

    const openEditRating = (rating) => {
        setEditingRating(rating)
        setSelectedAppointmentId(rating.appointment._id)
        setRatingValue(rating.rating)
        setReviewText(rating.review || '')
        setShowRatingModal(true)
    }

    const submitRating = async () => {
        if (!selectedAppointmentId) return
        if (!ratingValue || ratingValue < 1 || ratingValue > 5) {
            setError('הדירוג צריך להיות בין 1 ל-5')
            return
        }
        try {
            setSubmitting(true)
            setError('')

            let response
            if (editingRating) {
                // עריכת דירוג קיים
                response = await apiClient.put(`${config.BASE_URL}/ratings/${editingRating._id}`, {
                    rating: ratingValue,
                    review: reviewText?.trim() || undefined
                })
            } else {
                // יצירת דירוג חדש
                response = await apiClient.post(`${config.BASE_URL}/ratings`, {
                    appointmentId: selectedAppointmentId,
                    rating: ratingValue,
                    review: reviewText?.trim() || undefined
                })
            }

            if (response.ok) {
                setShowRatingModal(false)
                setSelectedAppointmentId('')
                setRatingValue(5)
                setReviewText('')
                setEditingRating(null)
                // רענון היסטוריה ודירוגים לאחר דירוג
                fetchHaircutHistory()
                fetchRatings()
            } else {
                const err = await response.json().catch(() => ({}))
                setError(err?.message || 'לא ניתן לשלוח דירוג')
            }
        } catch (_e) {
            setError('אירעה שגיאה בשליחת הדירוג')
        } finally {
            setSubmitting(false)
        }
    }



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

    if (error) {
        return (
            <SafeScreen paddingTop={-20} backgroundColor="#f8fafc">
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={48} color="#ef4444" />
                    <Text style={styles.errorText}>{error}</Text>
                    <Pressable style={styles.retryButton} onPress={fetchHaircutHistory}>
                        <Text style={styles.retryButtonText}>נסה שוב</Text>
                    </Pressable>
                </View>
            </SafeScreen>
        )
    }

    return (
        <SafeScreen backgroundColor="#f8fafc">
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-right" size={24} color="#111827" />
                        <Text style={styles.backText}>חזרה</Text>
                    </Pressable>
                    <Text style={styles.title}>היסטוריית תספורות</Text>
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <MaterialCommunityIcons name="scissors-cutting" size={32} color="#10b981" />
                        <Text style={styles.statNumber}>{appointments.length}</Text>
                        <Text style={styles.statLabel}>תספורות שבוצעו</Text>
                    </View>

                    <View style={styles.statCard}>
                        <MaterialCommunityIcons name="star" size={32} color="#f59e0b" />
                        <Text style={styles.statNumber}>
                            {appointments.length > 0
                                ? (appointments.reduce((sum, app) => sum + (app.totalPrice || 0), 0) / appointments.length).toFixed(0)
                                : '0'
                            }
                        </Text>
                        <Text style={styles.statLabel}>מחיר ממוצע</Text>
                    </View>
                </View>

                {/* Appointments List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>היסטוריית התספורות שלי</Text>

                    {appointments.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="scissors-cutting" size={48} color="#9ca3af" />
                            <Text style={styles.emptyText}>אין היסטוריית תספורות</Text>
                            <Text style={styles.emptySubtext}>התספורות שבוצעו יופיעו כאן</Text>
                        </View>
                    ) : (
                        appointments.map((appointment, index) => (
                            <View key={appointment._id || index} style={styles.appointmentCard}>
                                <View style={styles.appointmentHeader}>
                                    <View style={styles.customerInfo}>
                                        <MaterialCommunityIcons name="account" size={20} color="#6b7280" />
                                        <Text style={styles.customerName}>
                                            {appointment.barber?.firstName || 'ספר לא ידוע'}
                                        </Text>
                                    </View>
                                    <View style={styles.ratingContainer}>
                                        {appointment.totalPrice ? (
                                            <>
                                                <MaterialCommunityIcons name="currency-ils" size={16} color="#10b981" />
                                                <Text style={styles.ratingText}>{appointment.totalPrice}</Text>
                                            </>
                                        ) : (
                                            <Text style={styles.noRatingText}>ללא מחיר</Text>
                                        )}
                                    </View>
                                </View>

                                <View style={styles.appointmentDetails}>
                                    <View style={styles.detailRow}>
                                        <MaterialCommunityIcons name="calendar" size={16} color="#6b7280" />
                                        <Text style={styles.detailText}>
                                            {formatDate(appointment.date)}
                                        </Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <MaterialCommunityIcons name="clock" size={16} color="#6b7280" />
                                        <Text style={styles.detailText}>
                                            {appointment.startTime} - {appointment.endTime}
                                        </Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <MaterialCommunityIcons name="scissors-cutting" size={16} color="#6b7280" />
                                        <Text style={styles.detailText}>
                                            {appointment.service?.name || 'תספורת'}
                                        </Text>
                                    </View>
                                </View>

                                {appointment.notes && (
                                    <View style={styles.notesContainer}>
                                        <Text style={styles.notesLabel}>הערות:</Text>
                                        <Text style={styles.notesText}>{appointment.notes}</Text>
                                    </View>
                                )}

                                {/* הצגת דירוג קיים או כפתור דירוג */}
                                {(() => {
                                    const existingRating = ratings[appointment._id]
                                    return existingRating
                                })() ? (
                                    <View style={styles.ratingDisplay}>
                                        <View style={styles.ratingStars}>
                                            {[1, 2, 3, 4, 5].map(n => (
                                                <MaterialCommunityIcons
                                                    key={n}
                                                    name={n <= ratings[appointment._id].rating ? 'star' : 'star-outline'}
                                                    size={16}
                                                    color={n <= ratings[appointment._id].rating ? '#f59e0b' : '#d1d5db'}
                                                />
                                            ))}
                                        </View>
                                        {ratings[appointment._id].review && (
                                            <Text style={styles.ratingReview}>{ratings[appointment._id].review}</Text>
                                        )}
                                        <View style={styles.ratingActions}>
                                            <Pressable
                                                style={({ pressed }) => [styles.editButton, pressed && { opacity: 0.85 }]}
                                                onPress={() => openEditRating(ratings[appointment._id])}
                                            >
                                                <MaterialCommunityIcons name="pencil" size={14} color="#ffffff" />
                                                <Text style={styles.editButtonText}>ערוך</Text>
                                            </Pressable>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.actionsRow}>
                                        <Pressable
                                            style={({ pressed }) => [styles.rateButton, pressed && { opacity: 0.85 }]}
                                            onPress={() => openRatingForAppointment(appointment._id)}
                                        >
                                            <MaterialCommunityIcons name="star" size={16} color="#ffffff" />
                                            <Text style={styles.rateButtonText}>דרג</Text>
                                        </Pressable>
                                    </View>
                                )}
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
            {/* Rating Modal */}
            {showRatingModal && (
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.keyboardAvoidingView}
                    >
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{editingRating ? 'ערוך דירוג' : 'הוסף דירוג'}</Text>
                                <Pressable style={styles.modalClose} onPress={() => setShowRatingModal(false)}>
                                    <MaterialCommunityIcons name="close" size={22} color="#6b7280" />
                                </Pressable>
                            </View>

                            {!!error && (
                                <View style={styles.errorBanner}>
                                    <MaterialCommunityIcons name="alert" size={16} color="#b91c1c" />
                                    <Text style={styles.errorBannerText}>{error}</Text>
                                </View>
                            )}

                            <Text style={styles.modalLabel}>דירוג</Text>
                            <View style={styles.starsRow}>
                                {[1, 2, 3, 4, 5].map(n => (
                                    <Pressable key={n} onPress={() => setRatingValue(n)} style={styles.starPress}>
                                        <MaterialCommunityIcons
                                            name={n <= ratingValue ? 'star' : 'star-outline'}
                                            size={28}
                                            color={n <= ratingValue ? '#f59e0b' : '#9ca3af'}
                                        />
                                    </Pressable>
                                ))}
                            </View>

                            <Text style={styles.modalLabel}>חוות דעת (לא חובה)</Text>
                            <TextInput
                                style={styles.reviewInput}
                                value={reviewText}
                                onChangeText={setReviewText}
                                placeholder="כתוב חוות דעת..."
                                multiline
                                textAlign="right"
                            />

                            <View style={styles.modalActions}>
                                <Pressable style={styles.cancelBtn} onPress={() => setShowRatingModal(false)}>
                                    <Text style={styles.cancelBtnText}>ביטול</Text>
                                </Pressable>
                                <Pressable
                                    style={[styles.submitBtn, submitting && styles.disabledBtn]}
                                    onPress={submitRating}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <ActivityIndicator size="small" color="#ffffff" />
                                    ) : (
                                        <Text style={styles.submitBtnText}>{editingRating ? 'עדכן דירוג' : 'שלח דירוג'}</Text>
                                    )}
                                </Pressable>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
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
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12
    },
    statCard: {
        flex: 1,
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginTop: 8,
        marginBottom: 4
    },
    statLabel: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center'
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
    emptyContainer: {
        alignItems: 'center',
        padding: 40,
        gap: 12
    },
    emptyText: {
        fontSize: 18,
        color: '#6b7280',
        textAlign: 'center'
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center'
    },
    appointmentCard: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        gap: 12
    },
    appointmentHeader: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    customerInfo: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8
    },
    customerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827'
    },
    ratingContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 4
    },
    ratingText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#10b981'
    },
    noRatingText: {
        fontSize: 14,
        color: '#9ca3af'
    },
    appointmentDetails: {
        gap: 8
    },
    detailRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8
    },
    detailText: {
        fontSize: 14,
        color: '#6b7280'
    },
    notesContainer: {
        backgroundColor: '#f9fafb',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    notesLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
        textAlign: 'right'
    },
    notesText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'right',
        lineHeight: 20
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
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: 20,
        gap: 16
    },
    errorText: {
        fontSize: 18,
        color: '#ef4444',
        textAlign: 'center'
    },
    retryButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8
    },
    retryButtonText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 16
    },
    actionsRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'flex-end'
    },
    rateButton: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#f59e0b',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        alignSelf: 'flex-start'
    },
    rateButtonText: {
        color: '#ffffff',
        fontWeight: '600'
    },
    modalOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16
    },
    keyboardAvoidingView: {
        width: '100%',
        maxHeight: '90%'
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        width: '100%'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827'
    },
    modalClose: {
        padding: 4
    },
    modalLabel: {
        fontSize: 14,
        color: '#374151',
        marginTop: 8,
        marginBottom: 6,
        textAlign: 'right'
    },
    starsRow: {
        flexDirection: 'row-reverse',
        gap: 4,
        marginBottom: 8
    },
    starPress: {
        padding: 4
    },
    reviewInput: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 10,
        minHeight: 80,
        backgroundColor: '#fafafa',
        fontSize: 14,
        color: '#111827',
        textAlign: 'right'
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginTop: 12
    },
    cancelBtn: {
        flex: 1,
        backgroundColor: '#f3f4f6',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center'
    },
    cancelBtnText: {
        color: '#6b7280',
        fontWeight: '600'
    },
    submitBtn: {
        flex: 1,
        backgroundColor: '#3b82f6',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center'
    },
    disabledBtn: {
        opacity: 0.7
    },
    submitBtnText: {
        color: '#ffffff',
        fontWeight: '700'
    },
    errorBanner: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8,
        padding: 10,
        borderRadius: 8,
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fee2e2',
        marginBottom: 8
    },
    errorBannerText: {
        color: '#b91c1c',
        fontSize: 13,
        textAlign: 'right'
    },
    ratingDisplay: {
        backgroundColor: '#fef3c7',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#f59e0b',
        gap: 6
    },
    ratingStars: {
        flexDirection: 'row-reverse',
        gap: 2
    },
    ratingReview: {
        fontSize: 14,
        color: '#92400e',
        textAlign: 'right',
        fontStyle: 'italic'
    },
    ratingActions: {
        flexDirection: 'row-reverse',
        justifyContent: 'flex-end',
        marginTop: 8
    },
    editButton: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#3b82f6',
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 6,
        alignSelf: 'flex-start'
    },
    editButtonText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600'
    }
})
