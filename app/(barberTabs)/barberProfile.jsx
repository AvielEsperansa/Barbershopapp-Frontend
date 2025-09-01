import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native'
import config from '../../config'
import apiClient from '../../lib/apiClient'
import tokenManager from '../../lib/tokenManager'
import SafeScreen from '../components/SafeScreen'

export default function BarberProfile() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchMe()
    }, [])

    const fetchMe = async () => {
        try {
            console.log('🔍 Fetching user profile...')
            console.log('🌐 URL:', `${config.BASE_URL}/users/profile`)
            const response = await apiClient.get(`${config.BASE_URL}/users/profile`)
            console.log('📡 Response status:', response.status)

            if (response.ok) {
                const data = await response.json()
                console.log('✅ Profile data received:', data)
                // הבקנד מחזיר { user: {...} }
                setUser(data.user)
            } else {
                console.error('❌ Failed to fetch user data:', response.status)
                try {
                    const errorText = await response.text()
                    console.error('❌ Error response:', errorText)
                } catch (parseError) {
                    console.error('❌ Could not parse error response:', parseError)
                }

                // אם זה 404, זה יכול להיות שהנתיב לא נכון
                if (response.status === 404) {
                    console.error('❌ 404 - Route not found. Check if the backend route exists.')
                }
            }
        } catch (error) {
            console.error('❌ Error fetching user data:', error)
            console.error('❌ Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            })
        } finally {
            setLoading(false)
        }
    }

    const onLogout = async () => {
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
                            await tokenManager.clearTokens()
                            router.replace('/(auth)')
                        } catch (error) {
                            console.error('Logout error:', error)
                            Alert.alert('שגיאה', 'לא ניתן להתנתק כרגע')
                        }
                    }
                }
            ]
        )
    }

    if (loading) {
        return (
            <SafeScreen paddingTop={5}>
                <View style={styles.loadingContainer}>
                    <MaterialCommunityIcons name="loading" size={48} color="#3b82f6" />
                    <Text style={styles.loadingText}>טוען פרופיל...</Text>
                </View>
            </SafeScreen>
        )
    }

    if (!user) {
        return (
            <SafeScreen paddingTop={5}>
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={48} color="#ef4444" />
                    <Text style={styles.errorText}>לא ניתן לטעון את הפרופיל</Text>
                    <Text style={styles.errorSubtext}>אנא בדוק את החיבור שלך ונסה שוב</Text>
                    <Text style={styles.errorSubtext}>URL: {config.BASE_URL}/users/profile</Text>
                    <Text style={styles.errorSubtext}>אם הבעיה נמשכת, בדוק שהשרת רץ</Text>
                    <Text style={styles.errorSubtext}>ואת הנתיב /users/profile בבקנד</Text>
                    <Pressable style={styles.retryButton} onPress={fetchMe}>
                        <Text style={styles.retryButtonText}>נסה שוב</Text>
                    </Pressable>
                </View>
            </SafeScreen>
        )
    }

    return (
        <SafeScreen paddingTop={5}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.avatarWrap}>
                        {user.avatar ? (
                            <Image source={{ uri: user.avatar }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarFallback}>
                                <MaterialCommunityIcons name="account" size={48} color="#9ca3af" />
                            </View>
                        )}
                    </View>
                    <Text style={styles.name}>{user.firstName || 'שם לא זמין'}</Text>
                    <Text style={styles.email}>{user.email || 'אימייל לא זמין'}</Text>
                    <Text style={styles.role}>ברבר מקצועי</Text>
                </View>

                {/* Personal Info Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>מידע אישי</Text>
                    <Row
                        icon="account"
                        title="עריכת פרטים"
                        subtitle={'שם, אימייל, טלפון'}
                        onPress={() => router.push("/editProfile")} />

                </View>

                {/* Professional Info Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>מידע מקצועי</Text>
                    <Row
                        icon="scissors-cutting"
                        title="תספורות שבוצעו"
                        subtitle="צפה בהיסטוריית תספורות"
                        onPress={() => router.push("/haircutHistory")} />
                    <Row
                        icon="calendar-clock"
                        title="לוח זמנים"
                        subtitle="נהל זמינות"
                        onPress={() => { }} />
                    <Row
                        icon="star"
                        title="דירוגים"
                        subtitle="צפה בביקורות לקוחות"
                        onPress={() => { }} />
                </View>

                {/* Actions Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>פעולות</Text>
                    <Row
                        icon="shield-lock"
                        title="הגדרות אבטחה"
                        subtitle="שנה סיסמה והגדרות"
                        onPress={() => router.push("/security")} />
                    <Row
                        icon="help-circle"
                        title="עזרה ותמיכה"
                        subtitle="צור קשר עם התמיכה"
                        onPress={() => router.push("/help")} />
                    <Row
                        icon="logout"
                        title="התנתקות"
                        subtitle="חזרה לדף ההתחברות"
                        danger
                        onPress={onLogout} />
                </View>
            </ScrollView>
        </SafeScreen>
    )
}

// Row Component
function Row({ icon, title, subtitle, onPress, danger = false }) {
    return (
        <Pressable style={styles.row} onPress={onPress}>
            <View style={styles.rowLeft}>
                <MaterialCommunityIcons
                    name={icon}
                    size={24}
                    color={danger ? '#ef4444' : '#6b7280'}
                />
                <View>
                    <Text style={[styles.rowTitle, danger && styles.rowTitleDanger]}>
                        {title}
                    </Text>
                    <Text style={styles.rowSubtitle}>{subtitle}</Text>
                </View>
            </View>
            <MaterialCommunityIcons
                name="chevron-left"
                size={24}
                color="#9ca3af"
            />
        </Pressable>
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
        paddingBottom: 100,
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
    errorSubtext: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 8,
        textAlign: 'center'
    },
    retryButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8
    },
    retryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600'
    },
    header: {
        alignItems: 'center',
        gap: 8,
        paddingVertical: 24,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    avatarWrap: {
        width: 96,
        height: 96,
        borderRadius: 999,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        backgroundColor: '#f3f4f6',
        marginBottom: 4
    },
    avatar: {
        width: '100%',
        height: '100%'
    },
    avatarFallback: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    name: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827'
    },
    email: {
        color: '#6b7280'
    },
    role: {
        fontSize: 16,
        fontWeight: '600',
        color: '#3b82f6',
        backgroundColor: '#eff6ff',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        overflow: 'hidden'
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6b7280',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        textAlign: 'right'
    },
    row: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6'
    },
    rowLeft: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 10
    },
    rowTitle: {
        color: '#111827',
        fontWeight: '600'
    },
    rowTitleDanger: {
        color: '#ef4444'
    },
    rowSubtitle: {
        color: '#6b7280',
        fontSize: 14
    }
})
