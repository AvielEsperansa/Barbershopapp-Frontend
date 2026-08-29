import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native'
import config from '../../config'
import apiClient from '../../lib/apiClient'
import tokenManager from '../../lib/tokenManager'
import ActiveLoader from '../components/ActiveLoader'
import ImageUploader from '../components/ImageUploader'

export default function BarberProfile() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchMe()
    }, [])

    const handleImageUploaded = async (newImageUrl) => {
        setUser((prevUser) => ({
            ...prevUser,
            profileImage: newImageUrl
        }))
        await fetchMe()
    };

    const fetchMe = async () => {
        try {
            const response = await apiClient.get(`${config.BASE_URL}/users/profile`)
            const text = await response.text()
            let data
            try {
                data = JSON.parse(text)
            } catch (e) {
                // Parse error
            }

            if (response.ok && data) {
                setUser(data.user)
            }
        } catch (error) {
            console.error('❌ Error fetching user data:', error)
        } finally {
            setLoading(false)
        }
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
                        } catch (error) {
                            router.replace('/(auth)');
                        }
                    }
                }
            ]
        )
    }

    if (loading) {
        return (
            <ActiveLoader
                message="טוען פרופיל ספר..."
                subMessage="טוען נתונים והגדרות ניהול..."
                icon="scissors-cutting"
                backgroundColor="#0f172a"
                statusBarStyle="light"
                accentColor="#3b82f6"
            />
        )
    }

    if (!user) {
        return (
            // <SafeScreen paddingTop={5} backgroundColor="#0f172a" statusBarStyle="light">
            <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={48} color="#ef4444" />
                <Text style={styles.errorText}>לא ניתן לטעון את הפרופיל</Text>
                <Pressable style={styles.retryButton} onPress={fetchMe}>
                    <Text style={styles.retryButtonText}>נסה שוב</Text>
                </Pressable>
                <Row
                    icon="logout"
                    title="התנתקות"
                    subtitle="חזרה לדף ההתחברות"
                    danger
                    onPress={onLogout} />
            </View>
            // </SafeScreen>
        )
    }

    return (
        // <SafeScreen backgroundColor="#0f172a" statusBarStyle="light">
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
        >
            {/* Header Card */}
            <View style={styles.headerCard}>
                <ImageUploader
                    currentImage={user?.profileImageData?.url || user?.profileImage}
                    onImageUploaded={handleImageUploaded}
                    size={100}
                    showOverlay={true}
                    fileFieldName="profileImage"
                    uploadEndpoint="/users/upload-profile-image"
                    placeholderText="תמונת ספר"
                />
                <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
                <View style={styles.badgeRow}>
                    <View style={styles.roleBadge}>
                        <MaterialCommunityIcons name="scissors-cutting" size={14} color="#3b82f6" />
                        <Text style={styles.roleBadgeText}>ספר מורשה</Text>
                    </View>
                    {!!user.phone && (
                        <View style={styles.phoneBadge}>
                            <MaterialCommunityIcons name="phone" size={13} color="#94a3b8" />
                            <Text style={styles.phoneBadgeText}>{user.phone}</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Personal Info Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>מידע אישי</Text>
                <Row
                    icon="account-edit"
                    title="עריכת פרטים"
                    subtitle="שם ותמונה"
                    onPress={() => router.push("/editProfile")} />
            </View>

            {/* Professional Info Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>מידע מקצועי</Text>
                <Row
                    icon="content-cut"
                    title="תספורות שבוצעו"
                    subtitle="היסטוריית תורים שבוצעו במספרה"
                    onPress={() => router.push("/haircutHistory")} />
                <Row
                    icon="star"
                    title="דירוגים וביקורות"
                    subtitle="חוות דעת של לקוחות"
                    onPress={() => router.push("/barberRatings")} />
            </View>

            {/* Actions Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>הגדרות ופעולות</Text>
                <Row
                    icon="shield-lock"
                    title="הגדרות אבטחה"
                    subtitle="ניהול חשבון"
                    onPress={() => router.push("/security")} />
                <Row
                    icon="help-circle"
                    title="עזרה ותמיכה"
                    subtitle="פנייה לתמיכה טכנית"
                    onPress={() => router.push("/help")} />
                <Row
                    icon="logout"
                    title="התנתקות"
                    subtitle="חזרה למסך ההתחברות"
                    danger
                    onPress={onLogout} />
            </View>
        </ScrollView>
        // </SafeScreen>
    )
}

function Row({ icon, title, subtitle, onPress, danger = false }) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.row,
                danger && styles.rowDanger,
                pressed && { backgroundColor: danger ? 'rgba(220, 38, 38, 0.1)' : 'rgba(59, 130, 246, 0.08)' }
            ]}
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                onPress()
            }}
        >
            <View style={styles.rowLeft}>
                <View style={[styles.rowIconCircle, danger && styles.rowIconCircleDanger]}>
                    <MaterialCommunityIcons
                        name={icon}
                        size={20}
                        color={danger ? '#ef4444' : '#3b82f6'}
                    />
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.rowTitle, danger && styles.rowTitleDanger]}>
                        {title}
                    </Text>
                    <Text style={styles.rowSubtitle}>{subtitle}</Text>
                </View>
            </View>
            <MaterialCommunityIcons
                name="chevron-left"
                size={20}
                color={danger ? '#ef4444' : '#475569'}
            />
        </Pressable>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a'
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
        backgroundColor: '#0f172a',
        gap: 16
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
        backgroundColor: '#0f172a',
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
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12
    },
    retryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600'
    },
    headerCard: {
        alignItems: 'center',
        gap: 10,
        paddingVertical: 28,
        paddingHorizontal: 20,
        backgroundColor: '#1e293b',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.15)',
    },
    name: {
        fontSize: 24,
        fontWeight: '800',
        color: '#f1f5f9'
    },
    badgeRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8,
        marginTop: 2,
    },
    roleBadge: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.25)',
    },
    roleBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#3b82f6',
    },
    phoneBadge: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
    },
    phoneBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#94a3b8',
    },
    section: {
        backgroundColor: '#1e293b',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
        overflow: 'hidden',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748b',
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 8,
        textAlign: 'right',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    row: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.04)'
    },
    rowLeft: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 12
    },
    rowIconCircle: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(59, 130, 246, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowIconCircleDanger: {
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
    },
    rowTitle: {
        color: '#e2e8f0',
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'right'
    },
    rowTitleDanger: {
        color: '#ef4444',
        textAlign: 'right'
    },
    rowSubtitle: {
        color: '#64748b',
        fontSize: 12,
        textAlign: 'right',
        marginTop: 1,
    },
    rowDanger: {
        backgroundColor: 'rgba(239, 68, 68, 0.04)'
    }
})
