import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import * as Haptics from 'expo-haptics'
import { router, useFocusEffect } from 'expo-router'
import React, { useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import config from '../../config'
import apiClient from '../../lib/apiClient'
import tokenManager from '../../lib/tokenManager'
import ImageUploader from '../components/ImageUploader'
import SafeScreen from '../components/SafeScreen'

export default function CustomerProfile() {
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState(null)
    const [completedCount, setCompletedCount] = useState(0)
    const tabBarHeight = useBottomTabBarHeight();

    const fetchMe = React.useCallback(async () => {
        setLoading(true)
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

    useFocusEffect(
        React.useCallback(() => {
            fetchMe()
        }, [fetchMe])
    )

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
                pressed && { backgroundColor: danger ? '#fee2e2' : '#f1f5f9' }
            ]}
        >
            <View style={styles.rowLeft}>
                <View style={[styles.rowIconCircle, danger && styles.rowIconCircleDanger]}>
                    <MaterialCommunityIcons name={icon} size={20} color={danger ? '#dc2626' : '#2563eb'} />
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.rowTitle, danger && styles.rowTitleDanger]}>{title}</Text>
                    {!!subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
                </View>
            </View>
            <MaterialCommunityIcons name="chevron-left" size={20} color={danger ? '#dc2626' : '#94a3b8'} />
        </Pressable>
    )

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <View style={styles.loadingSpinner}>
                    <MaterialCommunityIcons name="refresh" size={40} color="#2563eb" />
                </View>
                <Text style={styles.loadingText}>טוען פרופיל משתמש...</Text>
            </View>
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
        <SafeScreen backgroundColor="#f8fafc" statusBarStyle="dark">
            <ScrollView contentContainerStyle={[styles.container, { paddingBottom: tabBarHeight + 20 }]}>
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
                                <MaterialCommunityIcons name="crown" size={14} color="#d97706" />
                                <Text style={styles.vipBadgeText}>לקוח VIP ({completedCount} תספורות)</Text>
                            </View>
                        ) : (
                            <View style={styles.regularBadge}>
                                <MaterialCommunityIcons name="account-check" size={14} color="#2563eb" />
                                <Text style={styles.regularBadgeText}>עוד {5 - completedCount} תספורות ל-VIP</Text>
                            </View>
                        )}
                        {!!user.phone && (
                            <View style={styles.phoneBadge}>
                                <MaterialCommunityIcons name="phone" size={13} color="#475569" />
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
        </SafeScreen>
    )
}

const styles = StyleSheet.create({
    container: {
        gap: 16,
        paddingHorizontal: 16,
        paddingTop: 10,
        backgroundColor: '#f8fafc'
    },
    headerCard: {
        alignItems: 'center',
        gap: 10,
        paddingVertical: 24,
        paddingHorizontal: 20,
        backgroundColor: '#ffffff',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0f172a'
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
        backgroundColor: '#fef3c7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#fde68a',
    },
    vipBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#d97706',
    },
    regularBadge: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#eff6ff',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    regularBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#2563eb',
    },
    phoneBadge: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    phoneBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
    },
    section: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        overflow: 'hidden',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#64748b',
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
        borderTopColor: '#f1f5f9'
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
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowIconCircleDanger: {
        backgroundColor: '#fef2f2',
    },
    rowTitle: {
        color: '#0f172a',
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'right'
    },
    rowTitleDanger: {
        color: '#dc2626',
        textAlign: 'right'
    },
    rowSubtitle: {
        color: '#64748b',
        fontSize: 12,
        textAlign: 'right',
        marginTop: 1,
    },
    rowDanger: {
        backgroundColor: '#fff5f5'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        gap: 16
    },
    loadingSpinner: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#dbeafe'
    },
    loadingText: {
        fontSize: 16,
        color: '#64748b',
        fontWeight: '500'
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        gap: 16
    },
    errorText: {
        fontSize: 16,
        color: '#64748b',
        fontWeight: '500'
    }
})