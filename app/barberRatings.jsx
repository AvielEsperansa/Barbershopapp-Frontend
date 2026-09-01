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

export default function BarberRatings() {
    const [ratings, setRatings] = useState([])
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchBarberRatings()
        fetchBarberStats()
    }, [fetchBarberRatings, fetchBarberStats])

    const fetchBarberRatings = React.useCallback(async () => {
        try {
            setLoading(true)
            setError('')

            // נקבל את הדירוגים של הברבר
            const response = await apiClient.get(`${config.BASE_URL}/ratings/barber/${await getBarberId()}`)

            if (response.ok) {
                const data = await response.json()
                console.log('✅ Barber ratings received:', data)
                setRatings(data.ratings || [])
            } else {
                console.error('❌ Failed to fetch barber ratings:', response.status)
                const errorText = await response.text()
                console.error('❌ Error response:', errorText)
                throw new Error('לא ניתן לטעון דירוגים')
            }
        } catch (error) {
            console.error('❌ Error fetching barber ratings:', error)
            setError(error.message || 'אירעה שגיאה בטעינת הדירוגים')
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchBarberStats = React.useCallback(async () => {
        try {
            const barberId = await getBarberId()
            if (!barberId) {
                console.error('❌ No barber ID found')
                return
            }

            const response = await apiClient.get(`${config.BASE_URL}/ratings/barber/${barberId}/stats`)
            console.log('📡 Stats response status:', response.status)

            if (response.ok) {
                const data = await response.json()
                console.log('✅ Barber stats received:', data)
                // הנתונים נמצאים ב-stats.stats
                setStats(data.stats || data)
            } else {
                console.error('❌ Failed to fetch barber stats:', response.status)
                const errorText = await response.text()
                console.error('❌ Stats error response:', errorText)
            }
        } catch (error) {
            console.error('❌ Error fetching barber stats:', error)
        }
    }, [])

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

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const renderStars = (rating) => {
        return [1, 2, 3, 4, 5].map(n => (
            <MaterialCommunityIcons
                key={n}
                name={n <= rating ? 'star' : 'star-outline'}
                size={16}
                color={n <= rating ? '#f59e0b' : '#d1d5db'}
            />
        ))
    }

    if (loading) {
        return (
            <SafeScreen backgroundColor="#f8fafc">
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={styles.loadingText}>טוען דירוגים...</Text>
                </View>
            </SafeScreen>
        )
    }

    if (error) {
        return (
            <SafeScreen backgroundColor="#f8fafc">
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={48} color="#ef4444" />
                    <Text style={styles.errorText}>{error}</Text>
                    <Pressable style={styles.retryButton} onPress={fetchBarberRatings}>
                        <Text style={styles.retryButtonText}>נסה שוב</Text>
                    </Pressable>
                </View>
            </SafeScreen>
        )
    }

    return (
        <SafeScreen backgroundColor="#09090b">
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                {/* Glowing Red Background Orbs */}
                <View style={styles.orbTopRight} />
                <View style={styles.orbBottomLeft} />

                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-right" size={24} color="#ef4444" />
                        <Text style={styles.backText}>חזרה</Text>
                    </Pressable>
                    <Text style={styles.title}>דירוגים וביקורות</Text>
                </View>

                {/* Stats */}
                {stats && (
                    <View style={styles.statsContainer}>
                        <View style={styles.statCard}>
                            <MaterialCommunityIcons name="star" size={32} color="#f59e0b" />
                            <Text style={styles.statNumber}>
                                {stats.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
                            </Text>
                            <Text style={styles.statLabel}>דירוג ממוצע</Text>
                            <View style={styles.starsContainer}>
                                {[1, 2, 3, 4, 5].map(n => (
                                    <MaterialCommunityIcons
                                        key={n}
                                        name={n <= Math.round(stats.averageRating || 0) ? 'star' : 'star-outline'}
                                        size={14}
                                        color={n <= Math.round(stats.averageRating || 0) ? '#f59e0b' : '#d1d5db'}
                                    />
                                ))}
                            </View>
                        </View>

                        <View style={styles.statCard}>
                            <MaterialCommunityIcons name="account-multiple" size={32} color="#10b981" />
                            <Text style={styles.statNumber}>{stats.totalRatings || 0}</Text>
                            <Text style={styles.statLabel}>סה&quot;כ דירוגים</Text>
                        </View>
                    </View>
                )}

                {/* Debug info */}


                {/* Ratings List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ביקורות לקוחות</Text>

                    {ratings.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="star-outline" size={48} color="#9ca3af" />
                            <Text style={styles.emptyText}>אין דירוגים עדיין</Text>
                            <Text style={styles.emptySubtext}>הדירוגים יופיעו כאן כשהלקוחות יבדקו</Text>
                        </View>
                    ) : (
                        ratings.map((rating, index) => (
                            <View key={rating._id || index} style={styles.ratingCard}>
                                <View style={styles.ratingHeader}>
                                    <View style={styles.customerInfo}>
                                        <MaterialCommunityIcons name="account" size={20} color="#6b7280" />
                                        <Text style={styles.customerName}>
                                            {rating.customer?.firstName} {rating.customer?.lastName}
                                        </Text>
                                    </View>
                                    <View style={styles.ratingStars}>
                                        {renderStars(rating.rating)}
                                    </View>
                                </View>

                                <View style={styles.ratingDetails}>
                                    <View style={styles.detailRow}>
                                        <MaterialCommunityIcons name="calendar" size={16} color="#6b7280" />
                                        <Text style={styles.detailText}>
                                            {formatDate(rating.appointment?.date)}
                                        </Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <MaterialCommunityIcons name="clock" size={16} color="#6b7280" />
                                        <Text style={styles.detailText}>
                                            {rating.appointment?.startTime} - {rating.appointment?.endTime}
                                        </Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <MaterialCommunityIcons name="scissors-cutting" size={16} color="#6b7280" />
                                        <Text style={styles.detailText}>
                                            {rating.appointment?.service?.name || 'תספורת'}
                                        </Text>
                                    </View>
                                </View>

                                {!!rating.review && (
                                    <View style={styles.reviewContainer}>
                                        <Text style={styles.reviewLabel}>חוות דעת:</Text>
                                        <Text style={styles.reviewText}>{rating.review}</Text>
                                    </View>
                                )}

                                <View style={styles.ratingFooter}>
                                    <Text style={styles.ratingDate}>
                                        {formatDate(rating.createdAt)}
                                    </Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeScreen>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#09090b'
    },
    orbTopRight: {
        position: 'absolute',
        top: -60,
        right: -60,
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
    },
    orbBottomLeft: {
        position: 'absolute',
        bottom: -60,
        left: -60,
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: 'rgba(220, 38, 38, 0.08)',
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
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    backText: {
        fontSize: 14,
        color: '#ef4444',
        fontWeight: 'bold'
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#ffffff',
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
        backgroundColor: 'rgba(24, 24, 27, 0.85)',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)'
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#ffffff',
        marginTop: 8,
        marginBottom: 4
    },
    statLabel: {
        fontSize: 14,
        color: '#a1a1aa',
        textAlign: 'center'
    },
    starsContainer: {
        flexDirection: 'row-reverse',
        gap: 2,
        marginTop: 4
    },
    section: {
        backgroundColor: 'rgba(24, 24, 27, 0.85)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)',
        overflow: 'hidden'
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
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
        color: '#a1a1aa',
        textAlign: 'center'
    },
    emptySubtext: {
        fontSize: 14,
        color: '#71717a',
        textAlign: 'center'
    },
    ratingCard: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(39, 39, 42, 0.8)',
        gap: 12
    },
    ratingHeader: {
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
        color: '#ffffff'
    },
    ratingStars: {
        flexDirection: 'row-reverse',
        gap: 2
    },
    ratingDetails: {
        gap: 8
    },
    detailRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8
    },
    detailText: {
        fontSize: 14,
        color: '#a1a1aa'
    },
    reviewContainer: {
        backgroundColor: '#27272a',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)'
    },
    reviewLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 4,
        textAlign: 'right'
    },
    reviewText: {
        fontSize: 14,
        color: '#d4d4d8',
        textAlign: 'right',
        lineHeight: 20
    },
    ratingFooter: {
        flexDirection: 'row-reverse',
        justifyContent: 'flex-end'
    },
    ratingDate: {
        fontSize: 12,
        color: '#71717a',
        textAlign: 'right'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#09090b',
        gap: 16
    },
    loadingText: {
        fontSize: 18,
        color: '#a1a1aa'
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#09090b',
        padding: 20,
        gap: 16
    },
    errorText: {
        fontSize: 18,
        color: '#ef4444',
        textAlign: 'center'
    },
    retryButton: {
        backgroundColor: '#dc2626',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8
    },
    retryButtonText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 16
    },
    debugContainer: {
        backgroundColor: '#27272a',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16
    },
    debugText: {
        fontSize: 12,
        color: '#6b7280',
        fontFamily: 'monospace'
    }
})
