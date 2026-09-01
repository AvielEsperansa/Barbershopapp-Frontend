import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import * as Haptics from 'expo-haptics'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import {
    Image,
    Linking,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import config from '../../config'
import apiClient from '../../lib/apiClient'

export default function CustomerDashboard() {
    const tabBarHeight = useBottomTabBarHeight()
    const [user, setUser] = useState(null)
    const [upcomingAppointment, setUpcomingAppointment] = useState(null)
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)

    const DEFAULT_ANNOUNCEMENTS = [
        {
            _id: '1',
            icon: 'sale',
            title: '🔥 מבצע אמצע שבוע מסעיר!',
            content: '10% הנחה על כל עיצוב זקן בימי שלישי ורביעי. הקדימו להזמין תור!',
            timeText: 'לפני שעתיים',
            isNewItem: true,
            color: '#d97706',
            bgColor: '#fef3c7',
        },
        {
            _id: '2',
            icon: 'clock-check-outline',
            title: '⏰ שעות פעילות לסוף השבוע',
            content: 'ביום חמישי המספרה פתוחה עד 21:00. מומלץ לשריין תור מראש.',
            timeText: 'אתמול',
            isNewItem: false,
            color: '#2563eb',
            bgColor: '#dbeafe',
        },
    ]

    const DEFAULT_GALLERY = [
        { _id: '1', src: require('../../assets/gallery/cut1.jpeg'), title: 'פייד קלאסי' },
        { _id: '2', src: require('../../assets/gallery/cut2.jpeg'), title: 'עיצוב זקן' },
        { _id: '3', src: require('../../assets/gallery/cut3.jpeg'), title: 'טקסטורה מודרנית' },
    ]

    const [announcements, setAnnouncements] = useState(DEFAULT_ANNOUNCEMENTS)
    const [gallery, setGallery] = useState(DEFAULT_GALLERY)

    const formatTimeAgo = (dateString) => {
        if (!dateString) return ''
        try {
            const date = new Date(dateString)
            const now = new Date()
            const diffMs = now.getTime() - date.getTime()
            const diffMins = Math.floor(diffMs / 60000)
            const diffHours = Math.floor(diffMins / 60)
            const diffDays = Math.floor(diffHours / 24)

            if (diffMins < 60) return diffMins <= 1 ? 'ממש עכשיו' : `לפני ${diffMins} דקות`
            if (diffHours < 24) return `לפני ${diffHours} שעות`
            if (diffDays === 1) return 'אתמול'
            if (diffDays < 7) return `לפני ${diffDays} ימים`
            return date.toLocaleDateString('he-IL')
        } catch {
            return ''
        }
    }

    const fetchHomeData = useCallback(async (showLoading = false) => {
        if (showLoading) setLoading(true)
        try {
            // Fetch User Profile
            const profileRes = await apiClient.get(`${config.BASE_URL}/users/profile`)
            if (profileRes.ok) {
                const profileData = await profileRes.json()
                setUser(profileData.user)
            }

            // Fetch Upcoming Appointment
            const apptsRes = await apiClient.get(`${config.BASE_URL}/appointments/`)
            if (apptsRes.ok) {
                const apptsData = await apptsRes.json()
                const list = Array.isArray(apptsData) ? apptsData : (apptsData.appointments || [])
                const now = new Date()
                const future = list.find(a => a.status !== 'cancelled' && new Date(a.date) >= now)
                setUpcomingAppointment(future || null)
            }

            // Fetch Live Announcements
            try {
                const annRes = await apiClient.get(`${config.BASE_URL}/content/announcements`)
                if (annRes.ok) {
                    const annData = await annRes.json()
                    if (annData.announcements && annData.announcements.length > 0) {
                        setAnnouncements(annData.announcements)
                    }
                }
            } catch { }

            // Fetch Live Gallery
            try {
                const galRes = await apiClient.get(`${config.BASE_URL}/content/gallery`)
                if (galRes.ok) {
                    const galData = await galRes.json()
                    if (galData.items && galData.items.length > 0) {
                        setGallery(galData.items)
                    }
                }
            } catch { }
        } catch (e) {
            console.log('Error fetching home data:', e)
        } finally {
            if (showLoading) setLoading(false)
        }
    }, [])

    const onRefresh = useCallback(async () => {
        setRefreshing(true)
        await fetchHomeData(false)
        setRefreshing(false)
    }, [fetchHomeData])

    // עדכון מיידי בכניסה לטאב + סנכרון שקט כל 20 שניות כל עוד העמוד פתוח
    useFocusEffect(
        useCallback(() => {
            fetchHomeData(false)

            const interval = setInterval(() => {
                fetchHomeData(false)
            }, 20000)

            return () => clearInterval(interval)
        }, [fetchHomeData])
    )

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour >= 5 && hour < 12) return 'בוקר טוב ☀️'
        if (hour >= 12 && hour < 17) return 'צהריים טובים 🌤️'
        if (hour >= 17 && hour < 22) return 'ערב טוב 🌙'
        return 'לילה טוב 🌌'
    }

    const openInstagram = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        const url = 'https://www.instagram.com/oshri_barber'
        try { await Linking.openURL(url) } catch { }
    }

    const openWhatsApp = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        const phone = '972526525185'
        const msg = encodeURIComponent('היי, אשמח לקבוע תור ✂️')
        const url = `https://wa.me/${phone}?text=${msg}`
        try { await Linking.openURL(url) } catch { }
    }

    const openWaze = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        const url = 'https://waze.com/ul?q=Oshri%20Barber'
        try { await Linking.openURL(url) } catch { }
    }

    const avatarUrl = user?.profileImageData?.url ? user.profileImageData.url.replace('/svg?', '/png?') : null
    const [avatarError, setAvatarError] = useState(false)

    return (
        <ScrollView
            style={{ backgroundColor: "#09090b" }}
            contentContainerStyle={[styles.container, { paddingBottom: tabBarHeight + 20 }]}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="#ef4444"
                    colors={['#ef4444']}
                />
            }
            showsVerticalScrollIndicator={false}
        >
            {/* Glowing Red Background Orbs */}
            <View style={styles.orbTopRight} />
            <View style={styles.orbBottomLeft} />

            {/* Header Welcome Bar */}
            <View style={styles.welcomeRow}>
                <View style={styles.welcomeTextGroup}>
                    <Text style={styles.greetingText}>{getGreeting()}</Text>
                    <Text style={styles.userNameText}>
                        {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'אורח יקר'}
                    </Text>
                </View>
                <Pressable
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                        router.push('/(customerTabs)/customerProfile')
                    }}
                    style={styles.avatarButton}
                >
                    {avatarUrl && !avatarError ? (
                        <Image
                            source={{ uri: avatarUrl }}
                            style={styles.avatarImg}
                            onError={() => setAvatarError(true)}
                        />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <MaterialCommunityIcons name="account" size={26} color="#ef4444" />
                        </View>
                    )}
                </Pressable>
            </View>

            {/* Hero Banner Card */}
            <View style={styles.heroCard}>
                <View style={styles.heroContent}>
                    <View style={styles.heroBadge}>
                        <MaterialCommunityIcons name="scissors-cutting" size={14} color="#ef4444" />
                        <Text style={styles.heroBadgeText}>Oshri Barber Shop</Text>
                    </View>
                    <Text style={styles.heroTitle}>תספורת מושלמת.{'\n'}סטייל שמתאים לך.</Text>
                    <Text style={styles.heroSubtitle}>מיומנות, דיוק ויחס אישי בכל תספורת.</Text>

                    <Pressable
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                            router.push('/(customerTabs)/customerAppointment')
                        }}
                        style={({ pressed }) => [
                            styles.heroCtaBtn,
                            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                        ]}
                    >
                        <Text style={styles.heroCtaText}>זמן תור עכשיו</Text>
                        <MaterialCommunityIcons name="arrow-left" size={18} color="#ffffff" />
                    </Pressable>
                </View>
            </View>

            {/* Quick Action Buttons */}
            <View style={styles.quickActionsRow}>
                <Pressable
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                        router.push('/(customerTabs)/customerAppointment')
                    }}
                    style={styles.actionTile}
                >
                    <View style={[styles.actionIconCircle, { backgroundColor: '#dbeafe' }]}>
                        <MaterialCommunityIcons name="calendar-plus" size={22} color="#2563eb" />
                    </View>
                    <Text style={styles.actionTileTitle}>קביעת תור</Text>
                </Pressable>

                <Pressable
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                        router.push('/myAppointments')
                    }}
                    style={styles.actionTile}
                >
                    <View style={[styles.actionIconCircle, { backgroundColor: '#fef3c7' }]}>
                        <MaterialCommunityIcons name="calendar-clock" size={22} color="#d97706" />
                    </View>
                    <Text style={styles.actionTileTitle}>התורים שלי</Text>
                </Pressable>

                <Pressable
                    onPress={openWhatsApp}
                    style={styles.actionTile}
                >
                    <View style={[styles.actionIconCircle, { backgroundColor: '#d1fae5' }]}>
                        <MaterialCommunityIcons name="whatsapp" size={22} color="#059669" />
                    </View>
                    <Text style={styles.actionTileTitle}>צור קשר</Text>
                </Pressable>
            </View>

            {/* Upcoming Appointment Card (If exists) */}
            {upcomingAppointment && (
                <View style={styles.upcomingCard}>
                    <View style={styles.upcomingHeader}>
                        <View style={styles.upcomingBadge}>
                            <MaterialCommunityIcons name="clock-outline" size={14} color="#2563eb" />
                            <Text style={styles.upcomingBadgeText}>תור קרוב</Text>
                        </View>
                        <Text style={styles.upcomingDate}>
                            {new Date(upcomingAppointment.date).toLocaleDateString('he-IL')} • {upcomingAppointment.startTime}
                        </Text>
                    </View>
                    <View style={styles.upcomingBody}>
                        <MaterialCommunityIcons name="content-cut" size={24} color="#0f172a" />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.upcomingService}>
                                {upcomingAppointment.service?.name || 'תספורת'}
                            </Text>
                            <Text style={styles.upcomingBarber}>
                                ספר: {upcomingAppointment.barber?.firstName ? `${upcomingAppointment.barber.firstName} ${upcomingAppointment.barber.lastName || ''}`.trim() : 'אושרי'}
                            </Text>
                        </View>
                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                                router.push('/myAppointments')
                            }}
                            style={styles.viewApptBtn}
                        >
                            <Text style={styles.viewApptBtnText}>פרטים</Text>
                        </Pressable>
                    </View>
                </View>
            )}

            {/* NEW: 📢 חלון הודעות ועדכונים מהמספרה */}
            <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionTitleWithBadge}>
                        <Text style={styles.sectionTitleText}>📢 הודעות ועדכונים</Text>
                        <View style={styles.newBadgeDot}>
                            <Text style={styles.newBadgeDotText}>חדש</Text>
                        </View>
                    </View>
                    <Text style={styles.sectionSubtitleText}>עדכונים חמים מהמספרה</Text>
                </View>

                <View style={styles.announcementsList}>
                    {announcements.map((item) => (
                        <View key={item._id || item.id} style={styles.announcementItem}>
                            <View style={[styles.announcementIconWrap, { backgroundColor: item.bgColor || '#fef3c7' }]}>
                                <MaterialCommunityIcons name={item.icon || 'bullhorn'} size={22} color={item.color || '#d97706'} />
                            </View>
                            <View style={styles.announcementContent}>
                                <View style={styles.announcementTopRow}>
                                    <Text style={styles.announcementTitle}>{item.title}</Text>
                                    {(item.isNewItem || item.isNew) && <View style={styles.pulseDot} />}
                                </View>
                                <Text style={styles.announcementText}>{item.content}</Text>
                                <Text style={styles.announcementTime}>
                                    {item.timeText || formatTimeAgo(item.createdAt) || 'עכשיו'}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>

            {/* Haircut Gallery Section */}
            <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitleText}>✂️ גלריית עבודות וסטייל</Text>
                    <Text style={styles.sectionSubtitleText}>מבחר תספורות אחרונות מהמספרה</Text>
                </View>

                {gallery.length > 3 ? (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.galleryScroll}
                    >
                        {gallery.map((item) => (
                            <View key={item._id || item.id} style={styles.galleryScrollCard}>
                                <Image
                                    source={item.imageUrl ? { uri: item.imageUrl } : item.src}
                                    style={styles.galleryImg}
                                    resizeMode="cover"
                                />
                                {!!item.title && (
                                    <View style={styles.galleryOverlay}>
                                        <Text style={styles.galleryTag} numberOfLines={1}>{item.title}</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </ScrollView>
                ) : (
                    <View style={styles.galleryGrid}>
                        {gallery.map((item) => (
                            <View key={item._id || item.id} style={styles.galleryCard}>
                                <Image
                                    source={item.imageUrl ? { uri: item.imageUrl } : item.src}
                                    style={styles.galleryImg}
                                    resizeMode="cover"
                                />
                                {!!item.title && (
                                    <View style={styles.galleryOverlay}>
                                        <Text style={styles.galleryTag} numberOfLines={1}>{item.title}</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                )}
            </View>

            {/* Connect / Social Bar */}
            <View style={styles.socialBarCard}>
                <Text style={styles.socialTitle}>עקבו אחרינו והישארו מעודכנים 📱</Text>
                <View style={styles.socialButtonsRow}>
                    <Pressable onPress={openInstagram} style={[styles.socialPill, styles.instaPill]}>
                        <MaterialCommunityIcons name="instagram" size={18} color="#fff" />
                        <Text style={styles.socialPillText}>Instagram</Text>
                    </Pressable>

                    <Pressable onPress={openWhatsApp} style={[styles.socialPill, styles.waPill]}>
                        <MaterialCommunityIcons name="whatsapp" size={18} color="#fff" />
                        <Text style={styles.socialPillText}>WhatsApp</Text>
                    </Pressable>

                    <Pressable onPress={openWaze} style={[styles.socialPill, styles.wazePill]}>
                        <MaterialCommunityIcons name="waze" size={18} color="#fff" />
                        <Text style={styles.socialPillText}>Waze</Text>
                    </Pressable>
                </View>
            </View>
        </ScrollView>
        // </SafeScreen>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        gap: 16,
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
    welcomeRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    welcomeTextGroup: {
        gap: 2,
    },
    greetingText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#a1a1aa',
        textAlign: 'right',
    },
    userNameText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'right',
    },
    avatarButton: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    avatarImg: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: 'rgba(239, 68, 68, 0.4)',
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.4)',
    },
    heroCard: {
        backgroundColor: 'rgba(24, 24, 27, 0.9)',
        borderRadius: 24,
        padding: 22,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    heroContent: {
        gap: 10,
    },
    heroBadge: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-end',
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.4)',
    },
    heroBadgeText: {
        color: '#ef4444',
        fontSize: 12,
        fontWeight: 'bold',
    },
    heroTitle: {
        color: '#ffffff',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'right',
        lineHeight: 32,
    },
    heroSubtitle: {
        color: '#a1a1aa',
        fontSize: 14,
        textAlign: 'right',
    },
    heroCtaBtn: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#dc2626',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 16,
        marginTop: 8,
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 4,
    },
    heroCtaText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    quickActionsRow: {
        flexDirection: 'row-reverse',
        gap: 10,
        justifyContent: 'space-between',
    },
    actionTile: {
        flex: 1,
        backgroundColor: 'rgba(24, 24, 27, 0.85)',
        borderRadius: 18,
        padding: 14,
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 2,
    },
    actionIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionTileTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
    },
    upcomingCard: {
        backgroundColor: 'rgba(24, 24, 27, 0.9)',
        borderRadius: 20,
        padding: 16,
        gap: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(239, 68, 68, 0.4)',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 3,
    },
    upcomingHeader: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    upcomingBadge: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },
    upcomingBadgeText: {
        color: '#ef4444',
        fontSize: 12,
        fontWeight: 'bold',
    },
    upcomingDate: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    upcomingBody: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 12,
        paddingTop: 4,
    },
    upcomingService: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'right',
    },
    upcomingBarber: {
        fontSize: 13,
        color: '#a1a1aa',
        textAlign: 'right',
    },
    viewApptBtn: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    viewApptBtnText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#ef4444',
    },
    sectionCard: {
        backgroundColor: 'rgba(24, 24, 27, 0.85)',
        borderRadius: 20,
        padding: 18,
        gap: 14,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 2,
    },
    sectionHeaderRow: {
        gap: 2,
    },
    sectionTitleWithBadge: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitleText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'right',
    },
    newBadgeDot: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },
    newBadgeDotText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    sectionSubtitleText: {
        fontSize: 13,
        color: '#a1a1aa',
        textAlign: 'right',
    },
    announcementsList: {
        gap: 10,
    },
    announcementItem: {
        flexDirection: 'row-reverse',
        gap: 12,
        backgroundColor: '#27272a',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    announcementIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    announcementContent: {
        flex: 1,
        gap: 3,
    },
    announcementTopRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    announcementTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'right',
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444',
    },
    announcementText: {
        fontSize: 13,
        color: '#d4d4d8',
        textAlign: 'right',
        lineHeight: 18,
    },
    announcementTime: {
        fontSize: 11,
        color: '#a1a1aa',
        textAlign: 'right',
        marginTop: 2,
    },
    galleryGrid: {
        flexDirection: 'row-reverse',
        gap: 10,
    },
    galleryCard: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#27272a',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)',
    },
    galleryScroll: {
        flexDirection: 'row-reverse',
        gap: 10,
        paddingVertical: 2,
    },
    galleryScrollCard: {
        width: 120,
        height: 120,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#27272a',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)',
    },
    galleryImg: {
        width: '100%',
        height: '100%',
    },
    galleryOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(9, 9, 11, 0.8)',
        paddingVertical: 4,
        paddingHorizontal: 6,
        alignItems: 'center',
    },
    galleryTag: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '600',
    },
    socialBarCard: {
        backgroundColor: 'rgba(24, 24, 27, 0.85)',
        borderRadius: 20,
        padding: 16,
        gap: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)',
    },
    socialTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
    },
    socialButtonsRow: {
        flexDirection: 'row-reverse',
        gap: 8,
        width: '100%',
    },
    socialPill: {
        flex: 1,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 12,
    },
    instaPill: {
        backgroundColor: '#e1306c',
    },
    waPill: {
        backgroundColor: '#25d366',
    },
    wazePill: {
        backgroundColor: '#33ccff',
    },
    socialPillText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: 'bold',
    },
})