import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useState } from 'react'
import {
    Alert,
    KeyboardAvoidingView,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native'
import SafeScreen from './components/SafeScreen'

export default function Help() {
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSendMessage = async () => {
        if (!message.trim()) {
            Alert.alert('שגיאה', 'אנא כתוב הודעה לפני השליחה')
            return
        }

        setLoading(true)
        try {
            // מספר הטלפון של בעל העסק (יש להחליף למספר האמיתי)
            const phoneNumber = '972526525185' // יש להחליף למספר האמיתי של בעל העסק

            // יצירת הודעה עם טקסט קבוע + ההודעה של המשתמש
            const fullMessage = `שלום, אני צריך עזרה:\n\n${message.trim()}`

            // יצירת URL לווצאפ
            const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(fullMessage)}`

            // בדיקה אם ווצאפ מותקן
            const canOpen = await Linking.canOpenURL(whatsappUrl)

            if (canOpen) {
                // פתיחת ווצאפ עם ההודעה
                await Linking.openURL(whatsappUrl)
                Alert.alert(
                    'ההודעה נשלחה!',
                    'ההודעה נפתחה בווצאפ. אנא שלח אותה כדי ליצור קשר עם בעל העסק.',
                    [
                        {
                            text: 'אישור',
                            onPress: () => {
                                setMessage('')
                                router.back()
                            }
                        }
                    ]
                )
            } else {
                // אם ווצאפ לא מותקן, נפתח את האפליקציה בחנות
                Alert.alert(
                    'ווצאפ לא מותקן',
                    'אנא התקן את ווצאפ כדי לשלוח הודעה',
                    [
                        { text: 'ביטול', style: 'cancel' },
                        {
                            text: 'התקן ווצאפ',
                            onPress: () => Linking.openURL('https://play.google.com/store/apps/details?id=com.whatsapp')
                        }
                    ]
                )
            }
        } catch (error) {
            Alert.alert('שגיאה', 'לא ניתן לפתוח את ווצאפ. אנא נסה שוב.', error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <SafeScreen backgroundColor="#09090b">
            <StatusBar barStyle="light-content" backgroundColor="#09090b" />

            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-right" size={24} color="#ef4444" />
                    <Text style={styles.backText}>חזרה</Text>
                </Pressable>
                <Text style={styles.title}>עזרה ותמיכה</Text>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView style={{ backgroundColor: "#09090b" }} contentContainerStyle={styles.content}>
                    {/* Glowing Red Background Orbs */}
                    <View style={styles.orbTopRight} />
                    <View style={styles.orbBottomLeft} />

                    {/* Info Section */}
                    <View style={styles.infoSection}>
                        <MaterialCommunityIcons name="help-circle-outline" size={48} color="#ef4444" />
                        <Text style={styles.infoTitle}>איך אפשר לעזור לך?</Text>
                        <Text style={styles.infoText}>
                            יש לך שאלה? צרור בקשה או בעיה?{'\n'}
                            כתוב לנו ונציג שלנו יחזור אליך בהקדם!
                        </Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.formSection}>
                        <Text style={styles.formLabel}>הודעה שלך</Text>
                        <TextInput
                            style={styles.messageInput}
                            placeholder="כתוב כאן את הודעתך..."
                            placeholderTextColor="#71717a"
                            value={message}
                            onChangeText={setMessage}
                            multiline
                            numberOfLines={5}
                            textAlignVertical="top"
                            textAlign="right"
                        />
                        <Text style={styles.helperText}>
                            ההודעה תיפתח באפליקציית ווצאפ ליצירת קשר ישיר עם בעל המספרה
                        </Text>
                    </View>

                    {/* Send Button */}
                    <Pressable
                        onPress={handleSendMessage}
                        disabled={loading || !message.trim()}
                        style={[
                            styles.sendButton,
                            (!message.trim() || loading) && styles.sendButtonDisabled
                        ]}
                    >
                        <MaterialCommunityIcons name="whatsapp" size={24} color="#ffffff" />
                        <Text style={styles.sendButtonText}>
                            {loading ? 'פותח ווצאפ...' : 'שלח הודעה בווצאפ'}
                        </Text>
                    </Pressable>

                    {/* Contact Info */}
                    <View style={styles.contactSection}>
                        <Text style={styles.contactTitle}>פרטי התקשרות נוספים</Text>

                        <View style={styles.contactItem}>
                            <MaterialCommunityIcons name="phone" size={20} color="#ef4444" />
                            <Text style={styles.contactText}>052-6525185</Text>
                        </View>

                        <View style={styles.contactItem}>
                            <MaterialCommunityIcons name="clock-outline" size={20} color="#ef4444" />
                            <Text style={styles.contactText}>ראשון - חמישי: 09:00 - 20:00</Text>
                        </View>

                        <View style={styles.contactItem}>
                            <MaterialCommunityIcons name="map-marker" size={20} color="#ef4444" />
                            <Text style={styles.contactText}>מספרת אושרי, ישראל</Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeScreen>
    )
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(239, 68, 68, 0.25)',
        backgroundColor: 'rgba(24, 24, 27, 0.95)',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    backText: {
        fontSize: 16,
        color: '#ef4444',
        marginRight: 4,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffff',
        flex: 1,
        textAlign: 'center',
        marginRight: 40,
    },
    content: {
        padding: 16,
        gap: 24,
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
    infoSection: {
        alignItems: 'center',
        paddingVertical: 24,
        backgroundColor: 'rgba(24, 24, 27, 0.85)',
        borderRadius: 16,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)',
    },
    infoTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#ffffff',
        marginTop: 16,
        marginBottom: 8,
    },
    infoText: {
        fontSize: 16,
        color: '#a1a1aa',
        textAlign: 'center',
        lineHeight: 24,
    },
    formSection: {
        backgroundColor: 'rgba(24, 24, 27, 0.85)',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)',
    },
    formLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 12,
        textAlign: 'right',
    },
    messageInput: {
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)',
        borderRadius: 10,
        padding: 16,
        fontSize: 16,
        color: '#ffffff',
        backgroundColor: '#27272a',
        minHeight: 120,
    },
    helperText: {
        fontSize: 14,
        color: '#a1a1aa',
        marginTop: 8,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    sendButton: {
        backgroundColor: '#25d366',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#25d366',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    sendButtonDisabled: {
        backgroundColor: '#3f3f46',
        shadowOpacity: 0.1,
    },
    sendButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '600',
    },
    contactSection: {
        backgroundColor: 'rgba(24, 24, 27, 0.85)',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)',
    },
    contactTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 16,
        textAlign: 'center',
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    contactText: {
        fontSize: 16,
        color: '#6b7280',
        flex: 1,
    },
})
