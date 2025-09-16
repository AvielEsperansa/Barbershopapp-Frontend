import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router, useFocusEffect } from 'expo-router'
import React, { useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import config from '../../config'
import apiClient from '../../lib/apiClient'
import tokenManager from '../../lib/tokenManager'
import ImageUploader from '../components/ImageUploader'

export default function CustomerProfile() {
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState(null)

    const fetchMe = React.useCallback(async () => {
        setLoading(true)
        try {
            const url = `${config.BASE_URL}/users/profile`
            const res = await apiClient.get(url)
            const json = await res.json()
            if (!res.ok)
                throw new Error(json?.error || 'Failed to load user profile')
            console.log('📱 User profile data:', json.user)
            setUser(json.user)
        }
        finally {
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
    }

    const handleImageUploaded = async (newImageUrl) => {
        setUser(prevUser => ({
            ...prevUser,
            profileImage: newImageUrl
        }))
        // רענון מהשרת כדי למשוך את הנתונים המעודכנים
        await fetchMe()
    }


    const onLogout = () => {
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
                            // מנקה את כל הטוקנים ועוצר את הרענון האוטומטי
                            await tokenManager.clearTokens()
                            // מעביר לדף ההתחברות
                            router.replace('/(auth)')
                        } catch {
                            // גם אם יש שגיאה, מעביר לדף ההתחברות
                            router.replace('/(auth)')
                        }
                    }
                }
            ]
        )
    }

    const Row = ({ icon, title, subtitle, onPress, danger }) => (
        <Pressable onPress={onPress} style={[styles.row, danger && styles.rowDanger]}>
            <View style={styles.rowLeft}>
                <MaterialCommunityIcons name={icon} size={22} color={danger ? '#b91c1c' : '#111827'} />
                <View>
                    <Text style={[styles.rowTitle, danger && styles.rowTitleDanger]}>{title}</Text>
                    {!!subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
                </View>
            </View>
            <MaterialCommunityIcons name="chevron-left" size={22} color={danger ? '#b91c1c' : '#9ca3af'} />
        </Pressable>
    )

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <View style={styles.loadingSpinner}>
                    <MaterialCommunityIcons name="refresh" size={48} color="#3b82f6" />
                </View>
                <Text style={styles.loadingText}>טוען פרטי משתמש...</Text>
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
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <ImageUploader
                    currentImage={user?.profileImageData.url}
                    onImageUploaded={handleImageUploaded}
                    size={96}
                    showOverlay={false}
                    fileFieldName="profileImage"
                    uploadEndpoint="/users/upload-profile-image"
                    placeholderText="הוסף תמונת פרופיל"
                />
                <Text style={styles.name}>{fullName()}</Text>
                {!!user?.email && <Text style={styles.email}>{user.email}</Text>}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>הפרופיל שלי</Text>
                <Row
                    icon="account-edit"
                    title="עריכת פרטים"
                    subtitle="שם, אימייל, תמונה"
                    onPress={() => router.push("/editProfile")} />
                <Row
                    icon="shield-lock"
                    title="אבטחה"
                    subtitle="סיסמה, אימות ועוד"
                    onPress={() => router.push("/security")} />
                <Row
                    icon="bell"
                    title="הגדרות הודעות"
                    subtitle="נהל את ההודעות והתראות"
                    onPress={() => router.push("/notificationSettings")} />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>פעולות</Text>
                <Row
                    icon="calendar-clock"
                    title="התורים שלי"
                    subtitle="צפה בתורים עתידיים"
                    onPress={() => router.push("/myAppointments")} />
                <Row
                    icon="scissors-cutting"
                    title="היסטוריית תספורות"
                    subtitle="צפה בכל התורים הקודמים"
                    onPress={() => router.push("/haircutHistory")} />
                <Row
                    icon="help-circle"
                    title="עזרה ותמיכה"
                    subtitle="צור קשר עם בעל העסק"
                    onPress={() => router.push("/help")} />
                <Row
                    icon="logout"
                    title="התנתקות"
                    subtitle="חזרה לדף ההתחברות"
                    danger
                    onPress={onLogout} />
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        gap: 16,
        backgroundColor: '#f8fafc'
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
    name: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827'
    },
    email: {
        color: '#6b7280'
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
        color: '#b91c1c'
    },
    rowSubtitle: {
        color: '#6b7280',
        fontSize: 12
    },
    rowDanger: {
        backgroundColor: '#fff7f7'
    },
    loadingNote: {
        alignItems: 'center',
        paddingVertical: 8
    },
    loadingNoteText: {
        color: '#6b7280'
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
        color: '#6b7280',
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
        color: '#6b7280',
        fontWeight: '500'
    }
})