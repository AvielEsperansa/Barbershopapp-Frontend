import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router, useFocusEffect } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native'
import config from '../../config'
import apiClient from '../../lib/apiClient'
import SafeScreen from '../components/SafeScreen'

export default function DayOffList() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [dayOffs, setDayOffs] = useState([])
    const [barberId, setBarberId] = useState('')

    useEffect(() => {
        loadBarberProfile()
    }, [])

    useEffect(() => {
        if (barberId) {
            loadDayOffs()
        }
    }, [barberId])

    useFocusEffect(
        React.useCallback(() => {
            if (barberId) {
                loadDayOffs()
            }
        }, [barberId])
    )

    const loadBarberProfile = async () => {
        const response = await apiClient.get(`${config.BASE_URL}/users/profile`)
        if (response.ok) {
            const data = await response.json()
            setBarberId(data.user._id)
        }
    }

    const loadDayOffs = async () => {
        try {
            setLoading(true)
            setError('')

            const response = await apiClient.get(`${config.BASE_URL}/day-off`)

            if (response.ok) {
                const data = await response.json()
                setDayOffs(data.daysOff || [])
            } else {
                console.error('Failed to load day offs:', response.status)
                setError('שגיאה בטעינת ימי החופש')
            }
        } catch (error) {
            console.error('Error loading day offs:', error)
            setError('שגיאה בטעינת ימי החופש')
        } finally {
            setLoading(false)
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
                                loadDayOffs() // רענון הרשימה
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
        return date.toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const formatTime = (time) => {
        if (!time) return ''
        return time.substring(0, 5)
    }

    if (loading) {
        return (
            <SafeScreen paddingTop={5}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={styles.loadingText}>טוען ימי חופש...</Text>
                </View>
            </SafeScreen>
        )
    }

    return (
        <SafeScreen paddingTop={5}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-right" size={24} color="#111827" />
                        <Text style={styles.backText}>חזרה</Text>
                    </Pressable>
                    <Text style={styles.title}>ימי חופש</Text>
                </View>

                {!!error && (
                    <View style={styles.errorContainer}>
                        <MaterialCommunityIcons name="alert-circle" size={20} color="#ef4444" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {/* Add New Day Off Button */}
                <Pressable
                    style={styles.addButton}
                    onPress={() => router.push('/(barberTabs)/addDayOff')}
                >
                    <MaterialCommunityIcons name="plus" size={20} color="#ffffff" />
                    <Text style={styles.addButtonText}>הוסף יום חופש חדש</Text>
                </Pressable>

                {/* Day Offs List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ימי חופש מוגדרים</Text>

                    {dayOffs.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="calendar-remove" size={48} color="#9ca3af" />
                            <Text style={styles.emptyText}>אין ימי חופש מוגדרים</Text>
                            <Text style={styles.emptySubtext}>לחץ על &quot;הוסף יום חופש חדש&quot; כדי להתחיל</Text>
                        </View>
                    ) : (
                        dayOffs.map((dayOff) => (
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
    errorContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fef2f2',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#fecaca'
    },
    errorText: {
        color: '#ef4444',
        fontSize: 14
    },
    addButton: {
        backgroundColor: '#3b82f6',
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 12
    },
    addButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16
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
        color: '#111827'
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
        fontWeight: '500'
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
        color: '#6b7280'
    },
    dayOffActions: {
        flexDirection: 'row-reverse',
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
        fontWeight: '500'
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
