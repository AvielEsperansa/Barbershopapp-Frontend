import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from "expo-router";
import React from "react";
import {
    Dimensions,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import SafeScreen from '../components/SafeScreen';

const { width } = Dimensions.get('window');

export default function AuthLandingIndex() {
    const gallery = [
        { id: '1', src: require('../../assets/gallery/cut1.jpeg'), title: 'פייד קלאסי' },
        { id: '2', src: require('../../assets/gallery/cut2.jpeg'), title: 'עיצוב זקן' },
        { id: '3', src: require('../../assets/gallery/cut3.jpeg'), title: 'טקסטורה מודרנית' },
    ];

    return (
        <SafeScreen backgroundColor="#09090b">
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.container}>
                    {/* Glowing Red Background Orbs */}
                    <View style={styles.orbTopRight} />
                    <View style={styles.orbBottomLeft} />

                    {/* Header Brand */}
                    <View style={styles.header}>
                        <View style={styles.logoBadge}>
                            <MaterialCommunityIcons name="scissors-cutting" size={44} color="#ef4444" />
                        </View>
                        <Text style={styles.brandTitle}>OSHRI BARBER</Text>
                        <View style={styles.redDividerRow}>
                            <View style={styles.redLine} />
                            <Text style={styles.redSubTitleText}>PRECISION • STYLE • FRESH CUTS</Text>
                            <View style={styles.redLine} />
                        </View>
                    </View>

                    {/* Hero Headline */}
                    <View style={styles.heroSection}>
                        <Text style={styles.heroMainTitle}>
                            החוויה היוקרתית{'\n'}
                            <Text style={styles.redHighlight}>לעיצוב וטיפוח השיער.</Text>
                        </Text>
                        <Text style={styles.heroSubtitle}>
                            קביעת תורים מהירה 24/7, מקצועיות ללא פשרות וסטייל שמתאים בדיוק לך.
                        </Text>
                    </View>

                    {/* About Oshri the Barber Section (קצת על אושרי הספר) */}
                    <View style={styles.aboutCard}>
                        <View style={styles.aboutHeaderRow}>
                            <MaterialCommunityIcons name="content-cut" size={24} color="#ef4444" />
                            <Text style={styles.aboutCardTitle}>קצת על אושרי הספר ✂️</Text>
                        </View>
                        <Text style={styles.aboutCardText}>
                            אושרי הוא ספר מקצועי עם תשוקה עמוקה לדיוק, סטייל בגזרות קלאסיות ומודרניות, ועיצוב זקן ברמה הגבוהה ביותר.
                            כל לקוח במספרה מקבל יחס אישי, חוויה מרעננת ותוצאה שמתאימה בדיוק לקו האישי שלו.
                        </Text>
                    </View>

                    {/* Assets Gallery Grid (גלריית תמונות מה-ASSETS) */}
                    <View style={styles.gallerySection}>
                        <View style={styles.galleryHeaderRow}>
                            <Text style={styles.gallerySectionTitle}>✂️ גלריית עבודות וסטייל</Text>
                            <Text style={styles.gallerySectionSubtitle}>מבחר תספורות אחרונות מהמספרה</Text>
                        </View>

                        <View style={styles.galleryGrid}>
                            {gallery.map((item) => (
                                <View key={item.id} style={styles.galleryCard}>
                                    <Image source={item.src} style={styles.galleryImg} />
                                    <View style={styles.galleryOverlay}>
                                        <Text style={styles.galleryTag}>{item.title}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Features List */}
                    <View style={styles.featuresContainer}>
                        <View style={styles.featureCard}>
                            <View style={styles.featureIconWrap}>
                                <MaterialCommunityIcons name="calendar-check" size={24} color="#ef4444" />
                            </View>
                            <View style={styles.featureTextWrap}>
                                <Text style={styles.featureTitle}>הזמנת תור מהירה</Text>
                                <Text style={styles.featureDesc}>בחירת תאריך ושעה בלחיצת כפתור 24/7</Text>
                            </View>
                        </View>

                        <View style={styles.featureCard}>
                            <View style={styles.featureIconWrap}>
                                <MaterialCommunityIcons name="cellphone-message" size={24} color="#ef4444" />
                            </View>
                            <View style={styles.featureTextWrap}>
                                <Text style={styles.featureTitle}>תזכורות SMS אוטומטיות</Text>
                                <Text style={styles.featureDesc}>קבלת תזכורת וקוד אימות מראש ללא סיסמאות</Text>
                            </View>
                        </View>

                        <View style={styles.featureCard}>
                            <View style={styles.featureIconWrap}>
                                <MaterialCommunityIcons name="crown" size={24} color="#ef4444" />
                            </View>
                            <View style={styles.featureTextWrap}>
                                <Text style={styles.featureTitle}>מועדון VIP בלעדי</Text>
                                <Text style={styles.featureDesc}>הטבות ותווית VIP מיוחדת לאחר 5 תספורות</Text>
                            </View>
                        </View>
                    </View>

                    {/* Action Call Buttons */}
                    <View style={styles.actionsGroup}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.primaryButton,
                                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                            ]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                router.push('/(auth)/login');
                            }}
                        >
                            <Text style={styles.primaryButtonText}>התחברות לחשבון שלי</Text>
                            <MaterialCommunityIcons name="arrow-left" size={20} color="#ffffff" />
                        </Pressable>

                        <Pressable
                            style={({ pressed }) => [
                                styles.secondaryButton,
                                pressed && { opacity: 0.85, backgroundColor: 'rgba(239, 68, 68, 0.15)' }
                            ]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push('/(auth)/signup');
                            }}
                        >
                            <Text style={styles.secondaryButtonText}>הרשמה מהירה ב-SMS 📱</Text>
                        </Pressable>
                    </View>

                    {/* Footer Copyright */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>© Oshri Barber • Precision & Style</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeScreen>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
        backgroundColor: '#09090b',
    },
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 30,
        gap: 20,
        position: 'relative',
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
        bottom: 80,
        left: -80,
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: 'rgba(225, 29, 72, 0.1)',
    },
    header: {
        alignItems: 'center',
        gap: 10,
        marginTop: 10,
    },
    logoBadge: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        borderWidth: 1.5,
        borderColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
    },
    brandTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#ffffff',
        letterSpacing: 3,
        textAlign: 'center',
    },
    redDividerRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8,
    },
    redLine: {
        width: 30,
        height: 1,
        backgroundColor: 'rgba(239, 68, 68, 0.4)',
    },
    redSubTitleText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#ef4444',
        letterSpacing: 1,
    },
    heroSection: {
        alignItems: 'center',
        gap: 10,
        marginVertical: 4,
    },
    heroMainTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        lineHeight: 42,
    },
    redHighlight: {
        color: '#ef4444',
    },
    heroSubtitle: {
        fontSize: 14,
        color: '#a1a1aa',
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: width * 0.88,
    },
    aboutCard: {
        backgroundColor: 'rgba(24, 24, 27, 0.8)',
        borderRadius: 20,
        padding: 18,
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)',
    },
    aboutHeaderRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8,
    },
    aboutCardTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'right',
    },
    aboutCardText: {
        fontSize: 14,
        color: '#d4d4d8',
        textAlign: 'right',
        lineHeight: 22,
    },
    gallerySection: {
        gap: 12,
    },
    galleryHeaderRow: {
        gap: 2,
    },
    gallerySectionTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'right',
    },
    gallerySectionSubtitle: {
        fontSize: 13,
        color: '#a1a1aa',
        textAlign: 'right',
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
        borderColor: 'rgba(239, 68, 68, 0.3)',
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
        backgroundColor: 'rgba(9, 9, 11, 0.75)',
        paddingVertical: 4,
        paddingHorizontal: 6,
        alignItems: 'center',
    },
    galleryTag: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '600',
    },
    featuresContainer: {
        gap: 10,
    },
    featureCard: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 14,
        backgroundColor: 'rgba(24, 24, 27, 0.8)',
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    featureIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    featureTextWrap: {
        flex: 1,
        gap: 2,
    },
    featureTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'right',
    },
    featureDesc: {
        fontSize: 12,
        color: '#a1a1aa',
        textAlign: 'right',
    },
    actionsGroup: {
        gap: 12,
        marginTop: 6,
    },
    primaryButton: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#dc2626',
        paddingVertical: 18,
        borderRadius: 16,
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 6,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: 'bold',
    },
    secondaryButton: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 1.5,
        borderColor: '#ef4444',
        paddingVertical: 16,
        borderRadius: 16,
    },
    secondaryButtonText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        alignItems: 'center',
        marginTop: 10,
    },
    footerText: {
        fontSize: 12,
        color: '#71717a',
        textAlign: 'center',
    },
});
