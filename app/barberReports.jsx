import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native'
import config from '../config'
import apiClient from '../lib/apiClient'
import SafeScreen from './components/SafeScreen'

export default function BarberReports() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState(null)
    const [appointments, setAppointments] = useState([])
    const [ratings, setRatings] = useState([])

    useEffect(() => {
        fetchAllData()
    }, [])

    const fetchAllData = async () => {
        try {
            setLoading(true)
            await Promise.all([
                fetchAppointments(),
                fetchRatings(),
                fetchStats()
            ])
        } catch (error) {
            console.error('Error fetching reports data:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchAppointments = async () => {
        try {
            const response = await apiClient.get(`${config.BASE_URL}/appointments/barber/customers?type=all`)
            if (response.ok) {
                const data = await response.json()
                let allAppointments = []
                if (data.customers && Array.isArray(data.customers)) {
                    data.customers.forEach(customerData => {
                        if (customerData.appointments && Array.isArray(customerData.appointments)) {
                            allAppointments = allAppointments.concat(customerData.appointments)
                        }
                    })
                }
                setAppointments(allAppointments)
            }
        } catch (error) {
            console.error('Error fetching appointments:', error)
        }
    }

    const fetchRatings = async () => {
        try {
            const barberId = await getBarberId()
            if (!barberId) return

            const response = await apiClient.get(`${config.BASE_URL}/ratings/barber/${barberId}`)
            if (response.ok) {
                const data = await response.json()
                setRatings(data.ratings || [])
            }
        } catch (error) {
            console.error('Error fetching ratings:', error)
        }
    }

    const fetchStats = async () => {
        try {
            const barberId = await getBarberId()
            if (!barberId) return

            const response = await apiClient.get(`${config.BASE_URL}/ratings/barber/${barberId}/stats`)
            if (response.ok) {
                const data = await response.json()
                setStats(data.stats || data)
            }
        } catch (error) {
            console.error('Error fetching stats:', error)
        }
    }

    const getBarberId = async () => {
        try {
            const response = await apiClient.get(`${config.BASE_URL}/users/profile`)
            if (response.ok) {
                const data = await response.json()
                return data.user._id
            }
        } catch (error) {
            console.error('Error getting barber ID:', error)
        }
        return null
    }

    const getMonthlyStats = () => {
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()

        const monthlyAppointments = appointments.filter(appt => {
            const apptDate = new Date(appt.date)
            return apptDate.getMonth() === currentMonth && apptDate.getFullYear() === currentYear
        })

        // חישוב ימים עובדים בחודש
        const workingDays = monthlyAppointments.reduce((days, appt) => {
            const date = new Date(appt.date).toDateString()
            if (!days.includes(date)) {
                days.push(date)
            }
            return days
        }, []).length

        return {
            appointments: monthlyAppointments.length,
            workingDays: workingDays,
            averagePerDay: workingDays > 0 ? (monthlyAppointments.length / workingDays).toFixed(1) : 0
        }
    }

    const getWeeklyStats = () => {
        const now = new Date()
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
        startOfWeek.setHours(0, 0, 0, 0)
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(endOfWeek.getDate() + 6)
        endOfWeek.setHours(23, 59, 59, 999)

        const weeklyAppointments = appointments.filter(appt => {
            const apptDate = new Date(appt.date)
            return apptDate >= startOfWeek && apptDate <= endOfWeek
        })

        // חישוב ימים עובדים בשבוע
        const workingDays = weeklyAppointments.reduce((days, appt) => {
            const date = new Date(appt.date).toDateString()
            if (!days.includes(date)) {
                days.push(date)
            }
            return days
        }, []).length

        return {
            appointments: weeklyAppointments.length,
            workingDays: workingDays,
            averagePerDay: workingDays > 0 ? (weeklyAppointments.length / workingDays).toFixed(1) : 0
        }
    }

    const getTopServices = () => {
        const serviceCount = {}
        appointments.forEach(appt => {
            const serviceName = appt.service?.name || 'תספורת'
            serviceCount[serviceName] = (serviceCount[serviceName] || 0) + 1
        })

        return Object.entries(serviceCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
    }

    const getRatingDistribution = () => {
        if (!stats?.ratingDistribution) return []
        return Object.entries(stats.ratingDistribution)
            .map(([rating, count]) => ({ rating: parseInt(rating), count }))
            .sort((a, b) => a.rating - b.rating)
    }

    if (loading) {
        return (
            <SafeScreen backgroundColor="#f8fafc">
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={styles.loadingText}>טוען דוחות...</Text>
                </View>
            </SafeScreen>
        )
    }

    const monthlyStats = getMonthlyStats()
    const weeklyStats = getWeeklyStats()
    const topServices = getTopServices()
    const ratingDistribution = getRatingDistribution()

    return (
        <SafeScreen backgroundColor="#f8fafc">
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-right" size={24} color="#111827" />
                        <Text style={styles.backText}>חזרה</Text>
                    </Pressable>
                    <Text style={styles.title}>דוחות וסטטיסטיקות</Text>
                </View>

                {/* Overview Stats */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>סקירה כללית</Text>

                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <MaterialCommunityIcons name="calendar-check" size={24} color="#10b981" />
                            <Text style={styles.statNumber}>{appointments.length}</Text>
                            <Text style={styles.statLabel}>סה&quot;כ תורים</Text>
                        </View>

                        <View style={styles.statCard}>
                            <MaterialCommunityIcons name="clock-outline" size={24} color="#3b82f6" />
                            <Text style={styles.statNumber}>
                                {appointments.filter(appt => {
                                    const apptDate = new Date(appt.date)
                                    const today = new Date()
                                    return apptDate.toDateString() === today.toDateString()
                                }).length}
                            </Text>
                            <Text style={styles.statLabel}>תורים היום</Text>
                        </View>

                        <View style={styles.statCard}>
                            <MaterialCommunityIcons name="star" size={24} color="#f59e0b" />
                            <Text style={styles.statNumber}>
                                {stats?.averageRating?.toFixed(1) || '0.0'}
                            </Text>
                            <Text style={styles.statLabel}>דירוג ממוצע</Text>
                        </View>

                        <View style={styles.statCard}>
                            <MaterialCommunityIcons name="account-multiple" size={24} color="#8b5cf6" />
                            <Text style={styles.statNumber}>{ratings.length}</Text>
                            <Text style={styles.statLabel}>ביקורות</Text>
                        </View>
                    </View>
                </View>

                {/* Monthly Performance */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ביצועים חודשיים</Text>

                    <View style={styles.monthlyStats}>
                        <View style={styles.monthlyCard}>
                            <Text style={styles.monthlyNumber}>{monthlyStats.appointments}</Text>
                            <Text style={styles.monthlyLabel}>תורים החודש</Text>
                        </View>

                        <View style={styles.monthlyCard}>
                            <Text style={styles.monthlyNumber}>{monthlyStats.workingDays}</Text>
                            <Text style={styles.monthlyLabel}>כמה ימים עבדתי החודש</Text>
                        </View>

                        <View style={styles.monthlyCard}>
                            <Text style={styles.monthlyNumber}>{monthlyStats.averagePerDay}</Text>
                            <Text style={styles.monthlyLabel}>ממוצע תספורות ליום</Text>
                        </View>
                    </View>
                </View>

                {/* Weekly Performance */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ביצועים שבועיים</Text>

                    <View style={styles.weeklyStats}>
                        <View style={styles.weeklyCard}>
                            <Text style={styles.weeklyNumber}>{weeklyStats.appointments}</Text>
                            <Text style={styles.weeklyLabel}>תורים השבוע</Text>
                        </View>

                        <View style={styles.weeklyCard}>
                            <Text style={styles.weeklyNumber}>{weeklyStats.workingDays}</Text>
                            <Text style={styles.weeklyLabel}>כמה ימים עבדתי השבוע</Text>
                        </View>

                        <View style={styles.weeklyCard}>
                            <Text style={styles.weeklyNumber}>{weeklyStats.averagePerDay}</Text>
                            <Text style={styles.weeklyLabel}>ממוצע תספורות ליום</Text>
                        </View>
                    </View>
                </View>

                {/* Top Services */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>השירותים הפופולריים</Text>

                    {topServices.length > 0 ? (
                        topServices.map(([serviceName, count], index) => (
                            <View key={serviceName} style={styles.serviceRow}>
                                <View style={styles.serviceInfo}>
                                    <Text style={styles.serviceRank}>#{index + 1}</Text>
                                    <Text style={styles.serviceName}>{serviceName}</Text>
                                </View>
                                <Text style={styles.serviceCount}>{count} פעמים</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>אין נתונים זמינים</Text>
                    )}
                </View>

                {/* Rating Distribution */}
                {ratingDistribution.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>התפלגות דירוגים</Text>

                        {ratingDistribution.map(({ rating, count }) => (
                            <View key={rating} style={styles.ratingRow}>
                                <View style={styles.ratingInfo}>
                                    <Text style={styles.ratingStars}>
                                        {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
                                    </Text>
                                    <Text style={styles.ratingLabel}>{rating} כוכבים</Text>
                                </View>
                                <Text style={styles.ratingCount}>{count}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
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
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 16,
        gap: 12
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#f8fafc',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    statNumber: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginTop: 8,
        marginBottom: 4
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'center'
    },
    monthlyStats: {
        flexDirection: 'row',
        padding: 16,
        gap: 12
    },
    monthlyCard: {
        flex: 1,
        backgroundColor: '#f0f9ff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#0ea5e9'
    },
    monthlyNumber: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0ea5e9',
        marginBottom: 4
    },
    monthlyLabel: {
        fontSize: 12,
        color: '#0369a1',
        textAlign: 'center'
    },
    weeklyStats: {
        flexDirection: 'row',
        padding: 16,
        gap: 12
    },
    weeklyCard: {
        flex: 1,
        backgroundColor: '#fef3c7',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f59e0b'
    },
    weeklyNumber: {
        fontSize: 18,
        fontWeight: '700',
        color: '#f59e0b',
        marginBottom: 4
    },
    weeklyLabel: {
        fontSize: 12,
        color: '#92400e',
        textAlign: 'center'
    },
    serviceRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6'
    },
    serviceInfo: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8
    },
    serviceRank: {
        fontSize: 14,
        fontWeight: '700',
        color: '#3b82f6',
        backgroundColor: '#eff6ff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12
    },
    serviceName: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '500'
    },
    serviceCount: {
        fontSize: 14,
        color: '#6b7280'
    },
    ratingRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6'
    },
    ratingInfo: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8
    },
    ratingStars: {
        fontSize: 16,
        color: '#f59e0b'
    },
    ratingLabel: {
        fontSize: 14,
        color: '#111827'
    },
    ratingCount: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '600'
    },
    emptyText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        padding: 20
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
    }
})
