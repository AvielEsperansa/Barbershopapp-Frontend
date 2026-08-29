import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from "expo-router";
import React from "react";
import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View
} from "react-native";
import SafeScreen from '../components/SafeScreen';

export default function AuthLandingIndex() {
    const { width, height } = useWindowDimensions();

    const isSmallScreen = height < 720;
    const isMediumScreen = height >= 720 && height < 840;

    const gallery = [
        { id: '1', src: require('../../assets/gallery/cut1.jpeg'), title: 'פייד קלאסי' },
        { id: '2', src: require('../../assets/gallery/cut2.jpeg'), title: 'עיצוב זקן' },
        { id: '3', src: require('../../assets/gallery/cut3.jpeg'), title: 'טקסטורה מודרנית' },
    ];

    return (
        <SafeScreen backgroundColor="#09090b">
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    {
                        paddingHorizontal: isSmallScreen ? 16 : 20,
                        paddingTop: isSmallScreen ? 6 : 14,
                        paddingBottom: isSmallScreen ? 14 : 22,
                        gap: isSmallScreen ? 8 : isMediumScreen ? 12 : 15,
                    }
                ]}
                bounces={false}
                showsVerticalScrollIndicator={false}
            >
                {/* Glowing Red Background Orbs */}
                <View style={styles.orbTopRight} />
                <View style={styles.orbBottomLeft} />

                {/* Header Brand */}
                <View style={[styles.header, { gap: isSmallScreen ? 6 : 8 }]}>
                    <View style={[
                        styles.logoBadge,
                        {
                            width: isSmallScreen ? 64 : isMediumScreen ? 74 : 80,
                            height: isSmallScreen ? 64 : isMediumScreen ? 74 : 80,
                            borderRadius: isSmallScreen ? 32 : isMediumScreen ? 37 : 40,
                        }
                    ]}>
                        <MaterialCommunityIcons
                            name="scissors-cutting"
                            size={isSmallScreen ? 32 : isMediumScreen ? 36 : 40}
                            color="#ef4444"
                        />
                    </View>
                    <Text style={[styles.brandTitle, { fontSize: isSmallScreen ? 22 : isMediumScreen ? 25 : 27 }]}>
                        OSHRI BARBER
                    </Text>
                    <View style={styles.redDividerRow}>
                        <View style={styles.redLine} />
                        <Text style={styles.redSubTitleText}>PRECISION • STYLE • FRESH CUTS</Text>
                        <View style={styles.redLine} />
                    </View>
                </View>

                {/* Hero Headline */}
                <View style={[styles.heroSection, { marginTop: isSmallScreen ? -6 : -4 }]}>
                    <Text style={[
                        styles.heroMainTitle,
                        {
                            fontSize: isSmallScreen ? 22 : isMediumScreen ? 26 : 28,
                            lineHeight: isSmallScreen ? 28 : isMediumScreen ? 34 : 36,
                        }
                    ]}>
                        החוויה היוקרתית{'\n'}
                        <Text style={styles.redHighlight}>לעיצוב וטיפוח השיער.</Text>
                    </Text>
                    <Text style={[
                        styles.heroSubtitle,
                        {
                            fontSize: isSmallScreen ? 12 : 13,
                            lineHeight: isSmallScreen ? 17 : 19,
                            maxWidth: width * 0.9,
                        }
                    ]}>
                        קביעת תורים מהירה 24/7, מקצועיות ללא פשרות וסטייל שמתאים בדיוק לך.
                    </Text>
                </View>

                {/* About Oshri the Barber Section */}
                <View style={[styles.aboutCard, { padding: isSmallScreen ? 12 : 16 }]}>
                    <View style={styles.aboutHeaderRow}>
                        <MaterialCommunityIcons name="content-cut" size={isSmallScreen ? 18 : 22} color="#ef4444" />
                        <Text style={[styles.aboutCardTitle, { fontSize: isSmallScreen ? 14.5 : 16 }]}>
                            קצת על אושרי הספר ✂️
                        </Text>
                    </View>
                    <Text style={[
                        styles.aboutCardText,
                        {
                            fontSize: isSmallScreen ? 12 : 13.5,
                            lineHeight: isSmallScreen ? 17 : 20,
                        }
                    ]}>
                        אושרי הוא ספר מקצועי עם תשוקה עמוקה לדיוק, סטייל בגזרות קלאסיות ומודרניות, ועיצוב זקן ברמה הגבוהה ביותר.
                        כל לקוח במספרה מקבל יחס אישי, חוויה מרעננת ותוצאה שמתאימה בדיוק לקו האישי שלו.
                    </Text>
                </View>

                {/* Assets Gallery Grid */}
                <View style={[styles.gallerySection, { gap: isSmallScreen ? 6 : 8 }]}>
                    <View style={styles.galleryHeaderRow}>
                        <Text style={[styles.gallerySectionTitle, { fontSize: isSmallScreen ? 14.5 : 16 }]}>
                            ✂️ גלריית עבודות וסטייל
                        </Text>
                        <Text style={styles.gallerySectionSubtitle}>מבחר תספורות אחרונות מהמספרה</Text>
                    </View>

                    <View style={styles.galleryGrid}>
                        {gallery.map((item) => (
                            <View key={item.id} style={styles.galleryCard}>
                                <Image source={item.src} style={styles.galleryImg} />
                                <View style={styles.galleryOverlay}>
                                    <Text style={[styles.galleryTag, { fontSize: isSmallScreen ? 10 : 11 }]}>
                                        {item.title}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Action Call Button */}
                <View style={styles.actionsGroup}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.primaryButton,
                            { paddingVertical: isSmallScreen ? 13 : 16 },
                            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                        ]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            router.push('/(auth)/login');
                        }}
                    >
                        <Text style={[styles.primaryButtonText, { fontSize: isSmallScreen ? 15 : 16 }]}>
                            התחברות לחשבון שלי
                        </Text>
                        <MaterialCommunityIcons name="arrow-left" size={isSmallScreen ? 18 : 20} color="#ffffff" />
                    </Pressable>
                </View>

                {/* Footer Copyright */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>© Oshri Barber • Precision & Style</Text>
                </View>
            </ScrollView>
        </SafeScreen>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
        backgroundColor: '#09090b',
        justifyContent: 'space-between',
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
        marginTop: 2,
    },
    logoBadge: {
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
        gap: 2,
    },
    heroMainTitle: {
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
    },
    redHighlight: {
        color: '#ef4444',
    },
    heroSubtitle: {
        color: '#a1a1aa',
        textAlign: 'center',
    },
    aboutCard: {
        backgroundColor: 'rgba(24, 24, 27, 0.8)',
        borderRadius: 18,
        gap: 5,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)',
    },
    aboutHeaderRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8,
    },
    aboutCardTitle: {
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'right',
    },
    aboutCardText: {
        color: '#d4d4d8',
        textAlign: 'right',
    },
    gallerySection: {
    },
    galleryHeaderRow: {
        gap: 2,
    },
    gallerySectionTitle: {
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'right',
    },
    gallerySectionSubtitle: {
        fontSize: 12,
        color: '#a1a1aa',
        textAlign: 'right',
    },
    galleryGrid: {
        flexDirection: 'row-reverse',
        gap: 8,
    },
    galleryCard: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 14,
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
        paddingVertical: 3,
        paddingHorizontal: 4,
        alignItems: 'center',
    },
    galleryTag: {
        color: '#ffffff',
        fontWeight: '600',
    },
    actionsGroup: {
        marginTop: 2,
    },
    primaryButton: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#dc2626',
        borderRadius: 16,
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 6,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    footer: {
        alignItems: 'center',
    },
    footerText: {
        fontSize: 11,
        color: '#71717a',
        textAlign: 'center',
    },
});
