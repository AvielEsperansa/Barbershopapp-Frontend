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
import ImageUploader from '../components/ImageUploader'
import SafeScreen from '../components/SafeScreen'

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
            <SafeScreen paddingTop={5} backgroundColor="#f8fafc">
                <View style={styles.loadingContainer}>
                    <MaterialCommunityIcons name="refresh" size={40} color="#2563eb" />
                    <Text style={styles.loadingText}>טוען פרופיל ספר...</Text>
                </View>
            </SafeScreen>
        )
    }

    if (!user) {
        return (
            <SafeScreen paddingTop={5} backgroundColor="#f8fafc">
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
            </SafeScreen>
        )
    }

    return (
        <SafeScreen backgroundColor="#f8fafc" statusBarStyle="dark">
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
                            <MaterialCommunityIcons name="scissors-cutting" size={14} color="#2563eb" />
                            <Text style={styles.roleBadgeText}>ספר מורשה</Text>
                        </View>
                        {!!user.phone && (
                            <View style={styles.phoneBadge}>
                                <MaterialCommunityIcons name="phone" size={13} color="#475569" />
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
        </SafeScreen>
    )
}

function Row({ icon, title, subtitle, onPress, danger = false }) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.row,
                danger && styles.rowDanger,
                pressed && { backgroundColor: danger ? '#fee2e2' : '#f1f5f9' }
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
                        color={danger ? '#dc2626' : '#2563eb'}
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
                color={danger ? '#dc2626' : '#94a3b8'}
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
        fontSize: 16,
        color: '#64748b',
        fontWeight: '500'
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
        backgroundColor: '#2563eb',
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
    roleBadge: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#dbeafe',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    roleBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1d4ed8',
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
    }
})
