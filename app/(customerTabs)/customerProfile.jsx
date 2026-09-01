import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import * as Haptics from 'expo-haptics'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import config from '../../config'
import apiClient from '../../lib/apiClient'
import tokenManager from '../../lib/tokenManager'
import ActiveLoader from '../components/ActiveLoader'
import ImageUploader from '../components/ImageUploader'

export default function CustomerProfile() {
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState(null)
    const [completedCount, setCompletedCount] = useState(0)
    const tabBarHeight = useBottomTabBarHeight()
    const { refreshed } = useLocalSearchParams()

    const fetchMe = React.useCallback(async (showLoading = false) => {
        if (showLoading) setLoading(true)
        try {
            const url = `${config.BASE_URL}/users/profile`
            const res = await apiClient.get(url)
            const json = await res.json()
            if (!res.ok)
                throw new Error(json?.error || 'Failed to load user profile')
            setUser(json.user)

            // Fetch user's appointments to check VIP status (5+ haircuts)
            const apptsRes = await apiClient.get(`${config.BASE_URL}/appointments/`)
            if (apptsRes.ok) {
                const apptsData = await apptsRes.json()
                const apptsList = Array.isArray(apptsData) ? apptsData : (apptsData.appointments || [])
                const now = new Date()
                const pastOrCompleted = apptsList.filter(a =>
                    a.status === 'completed' ||
                    (a.status !== 'cancelled' && new Date(a.date) <= now)
                )
                setCompletedCount(pastOrCompleted.length)
            }
        } catch (error) {
            console.error('❌ Error fetching customer profile:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    // טעינה ראשונית בלבד
    useEffect(() => {
        fetchMe(true)
    }, [fetchMe])

    // ריענון רק כאשר חזרנו לאחר שמירה מוצלחת בעריכת פרטים
    useEffect(() => {
        if (refreshed) {
            fetchMe(false)
        }
    }, [refreshed, fetchMe])

    const fullName = () => {
        if (!user) return 'אורח'
        if (user.firstName || user.lastName) return `${user.firstName || ''} ${user.lastName || ''}`.trim()
        return 'לקוח'
    }

    const handleImageUploaded = async (newImageUrl) => {
        setUser((prevUser) => ({
            ...prevUser,
            profileImage: newImageUrl
        }))
        await fetchMe()
    }

    const onLogout = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        Alert.alert(
            'התנתקות',
            'האם אתה בטוח שברצונך להתנתק?',
            [
                { text: 'ביטול', style: 'cancel' },
                {
                    text: 'התנתק',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await tokenManager.clearTokens();
                            router.replace('/(auth)');
                        } catch {
                            router.replace('/(auth)');
                        }
                    }
                }
            ]
        )
    }

    const Row = ({ icon, title, subtitle, onPress, danger }) => (
        <Pressable
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                onPress()
            }}
            style={({ pressed }) => [
                styles.row,
                danger && styles.rowDanger,
                pressed && { backgroundColor: danger ? 'rgba(220, 38, 38, 0.2)' : 'rgba(239, 68, 68, 0.1)' }
            ]}
        >
            <View style={styles.rowLeft}>
                <View style={[styles.rowIconCircle, danger && styles.rowIconCircleDanger]}>
                    <MaterialCommunityIcons name={icon} size={20} color={danger ? '#ef4444' : '#ef4444'} />
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.rowTitle, danger && styles.rowTitleDanger]}>{title}</Text>
                    {!!subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
                </View>
            </View>
            <MaterialCommunityIcons name="chevron-left" size={20} color={danger ? '#ef4444' : '#71717a'} />
        </Pressable>
    )

    if (loading) {
        return (
            <ActiveLoader
                message="טוען פרופיל משתמש..."
                subMessage="שולף את הנתונים וההטבות שלך..."
                icon="account-circle"
                backgroundColor="#09090b"
                statusBarStyle="light"
                accentColor="#ef4444"
            />
        )
    }

    if (!user) {
        return (
            <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={48} color="#ef4444" />
                <Text style={styles.errorText}>לא ניתן לטעון את הפרופיל</Text>
            </View>
        )
    }

    return (
        <ScrollView style={{ backgroundColor: "#09090b" }} contentContainerStyle={[styles.container, { paddingBottom: tabBarHeight + 20 }]}>
            {/* Glowing Red Background Orbs */}
            <View style={styles.orbTopRight} />
            <View style={styles.orbBottomLeft} />

            {/* Profile Card Header */}
            <View style={styles.headerCard}>
                <ImageUploader
                    currentImage={user?.profileImageData?.url}
                    onImageUploaded={handleImageUploaded}
                    size={100}
                    showOverlay={false}
                    fileFieldName="profileImage"
                    uploadEndpoint="/users/upload-profile-image"
                    placeholderText="הוסף תמונה"
                />
                <Text style={styles.name}>{fullName()}</Text>
                <View style={styles.badgeRow}>
                    {completedCount >= 5 ? (
                        <View style={styles.vipBadge}>
                            <MaterialCommunityIcons name="crown" size={14} color="#f59e0b" />
                            <Text style={styles.vipBadgeText}>לקוח VIP ({completedCount} תספורות)</Text>
                        </View>
                    ) : (
                        <View style={styles.regularBadge}>
                            <MaterialCommunityIcons name="account-check" size={14} color="#ef4444" />
                            <Text style={styles.regularBadgeText}>עוד {5 - completedCount} תספורות ל-VIP</Text>
                        </View>
                    )}
                    {!!user.phone && (
                        <View style={styles.phoneBadge}>
                            <MaterialCommunityIcons name="phone" size={13} color="#a1a1aa" />
                            <Text style={styles.phoneBadgeText}>{user.phone}</Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>הפרופיל שלי</Text>
                <Row
                    icon="account-edit"
                    title="עריכת פרטים"
                    subtitle="שם ותמונה"
                    onPress={() => router.push("/editProfile")} />
                <Row
                    icon="shield-lock"
                    title="אבטחה"
                    subtitle="אימות והגדרות חשבון"
                    onPress={() => router.push("/security")} />
                <Row
                    icon="bell"
                    title="הגדרות התראות"
                    subtitle="ניהול התראות SMS ופוש"
                    onPress={() => router.push("/notificationSettings")} />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>פעולות ותורים</Text>
                <Row
                    icon="calendar-clock"
                    title="התורים שלי"
                    subtitle="תורים קרובים"
                    onPress={() => router.push("/myAppointments")} />
                <Row
                    icon="scissors-cutting"
                    title="היסטוריית תספורות"
                    subtitle="תורים קודמים"
                    onPress={() => router.push("/haircutHistory")} />
                <Row
                    icon="help-circle"
                    title="עזרה ותמיכה"
                    subtitle="צור קשר עם המספרה"
                    onPress={() => router.push("/help")} />
                <Row
                    icon="logout"
                    title="התנתקות"
                    subtitle="יציאה מהחשבון"
                    danger
                    onPress={onLogout} />
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        gap: 16,
        paddingHorizontal: 16,
        paddingTop: 10,
        backgroundColor: '#09090b',
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
    headerCard: {
        alignItems: 'center',
        gap: 10,
        paddingVertical: 24,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(24, 24, 27, 0.9)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 3,
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ffffff'
    },
    badgeRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8,
        marginTop: 2,
    },
    vipBadge: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.4)',
    },
    vipBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#f59e0b',
    },
    regularBadge: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    regularBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#ef4444',
    },
    phoneBadge: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#27272a',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    phoneBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#a1a1aa',
    },
    section: {
        backgroundColor: 'rgba(24, 24, 27, 0.85)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#ef4444',
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 8,
        textAlign: 'right',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    row: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: 'rgba(39, 39, 42, 0.8)'
    },
    rowLeft: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 12
    },
    rowIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowIconCircleDanger: {
        backgroundColor: 'rgba(220, 38, 38, 0.2)',
    },
    rowTitle: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'right'
    },
    rowTitleDanger: {
        color: '#ef4444',
        textAlign: 'right'
    },
    rowSubtitle: {
        color: '#a1a1aa',
        fontSize: 12,
        textAlign: 'right',
        marginTop: 1,
    },
    rowDanger: {
        backgroundColor: 'rgba(239, 68, 68, 0.05)'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#09090b',
        gap: 16
    },
    loadingSpinner: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(239, 68, 68, 0.3)'
    },
    loadingText: {
        fontSize: 16,
        color: '#a1a1aa',
        fontWeight: '500'
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#09090b',
        gap: 16
    },
    errorText: {
        fontSize: 16,
        color: '#a1a1aa',
        fontWeight: '500'
    }
})