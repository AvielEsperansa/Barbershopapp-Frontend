import { MaterialCommunityIcons } from '@expo/vector-icons'
import React, { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, Text, View } from 'react-native'
import SafeScreen from './SafeScreen'

export default function ActiveLoader({
    message = 'טוען נתונים...',
    subMessage = 'רק עוד רגע קטן...',
    icon = 'scissors-cutting',
    backgroundColor = '#f8fafc',
    statusBarStyle = 'dark',
    accentColor = '#2563eb'
}) {
    // אנימציית סיבוב/נדנוד עדין
    const rotateAnim = useRef(new Animated.Value(0)).current
    // אנימציית פולס והגדלה
    const scaleAnim = useRef(new Animated.Value(1)).current
    const pulseRing1 = useRef(new Animated.Value(0)).current
    const pulseRing2 = useRef(new Animated.Value(0)).current
    const dotsAnim = useRef(new Animated.Value(0)).current

    useEffect(() => {
        // אנימציית טבעות פולס (Aura Glow)
        const pulseLoop = Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(pulseRing1, {
                        toValue: 1,
                        duration: 1800,
                        easing: Easing.out(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseRing1, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.sequence([
                    Animated.delay(600),
                    Animated.timing(pulseRing2, {
                        toValue: 1,
                        duration: 1800,
                        easing: Easing.out(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseRing2, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                ]),
                // פעימה עדינה של האייקון המרכזי
                Animated.sequence([
                    Animated.timing(scaleAnim, {
                        toValue: 1.12,
                        duration: 900,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 1,
                        duration: 900,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
                // נדנוד עדין של המספריים
                Animated.sequence([
                    Animated.timing(rotateAnim, {
                        toValue: 1,
                        duration: 450,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(rotateAnim, {
                        toValue: -1,
                        duration: 900,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(rotateAnim, {
                        toValue: 0,
                        duration: 450,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
            ])
        )

        pulseLoop.start()

        return () => pulseLoop.stop()
    }, [pulseRing1, pulseRing2, scaleAnim, rotateAnim])

    const spin = rotateAnim.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: ['-14deg', '0deg', '14deg'],
    })

    const ring1Scale = pulseRing1.interpolate({
        inputRange: [0, 1],
        outputRange: [0.9, 1.8],
    })
    const ring1Opacity = pulseRing1.interpolate({
        inputRange: [0, 0.4, 1],
        outputRange: [0.6, 0.3, 0],
    })

    const ring2Scale = pulseRing2.interpolate({
        inputRange: [0, 1],
        outputRange: [0.9, 2.1],
    })
    const ring2Opacity = pulseRing2.interpolate({
        inputRange: [0, 0.4, 1],
        outputRange: [0.5, 0.2, 0],
    })

    const isDark = backgroundColor === '#0f172a' || backgroundColor === '#09090b'

    return (
        <SafeScreen backgroundColor={backgroundColor} statusBarStyle={statusBarStyle}>
            <View style={[styles.container, { backgroundColor }]}>
                {/* מעגלי אנימציה פועמים ברקע */}
                <View style={styles.animCenterWrap}>
                    <Animated.View
                        style={[
                            styles.pulseRing,
                            {
                                borderColor: accentColor,
                                backgroundColor: accentColor,
                                transform: [{ scale: ring2Scale }],
                                opacity: ring2Opacity,
                            },
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.pulseRing,
                            {
                                borderColor: accentColor,
                                backgroundColor: accentColor,
                                transform: [{ scale: ring1Scale }],
                                opacity: ring1Opacity,
                            },
                        ]}
                    />

                    {/* כפתור מרכזי עם האייקון */}
                    <Animated.View
                        style={[
                            styles.iconContainer,
                            {
                                borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(37, 99, 235, 0.2)',
                                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                transform: [{ scale: scaleAnim }, { rotate: spin }],
                            },
                        ]}
                    >
                        <MaterialCommunityIcons name={icon} size={36} color={accentColor} />
                    </Animated.View>
                </View>

                {/* טקסטים ומחוון */}
                <View style={styles.textContainer}>
                    <Text style={[styles.messageText, { color: isDark ? '#f1f5f9' : '#0f172a' }]}>
                        {message}
                    </Text>
                    {!!subMessage && (
                        <Text style={[styles.subMessageText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                            {subMessage}
                        </Text>
                    )}

                    {/* פסי טעינה אקטיביים מעוצבים */}
                    <View style={styles.dotsBar}>
                        <View style={[styles.dot, { backgroundColor: accentColor }]} />
                        <View style={[styles.dot, styles.dotMiddle, { backgroundColor: accentColor }]} />
                        <View style={[styles.dot, { backgroundColor: accentColor }]} />
                    </View>
                </View>
            </View>
        </SafeScreen>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    animCenterWrap: {
        width: 140,
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    pulseRing: {
        position: 'absolute',
        width: 90,
        height: 90,
        borderRadius: 45,
    },
    iconContainer: {
        width: 84,
        height: 84,
        borderRadius: 42,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
    },
    textContainer: {
        alignItems: 'center',
        gap: 6,
    },
    messageText: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },
    subMessageText: {
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center',
    },
    dotsBar: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 6,
        marginTop: 14,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        opacity: 0.8,
    },
    dotMiddle: {
        width: 10,
        height: 10,
        borderRadius: 5,
        opacity: 1,
    },
})
