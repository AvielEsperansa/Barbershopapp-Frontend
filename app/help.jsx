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
        <SafeScreen paddingTop={5} backgroundColor="#f8fafc">
            <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-right" size={24} color="#111827" />
                    <Text style={styles.backText}>חזרה</Text>
                </Pressable>
                <Text style={styles.title}>עזרה ותמיכה</Text>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    {/* Info Section */}
                    <View style={styles.infoSection}>
                        <MaterialCommunityIcons name="help-circle" size={48} color="#3b82f6" />
                        <Text style={styles.infoTitle}>איך נוכל לעזור?</Text>
                        <Text style={styles.infoText}>
                            כתוב לנו מה אתה צריך עזרה בו ואנחנו נחזור אליך בהקדם האפשרי
                        </Text>
                    </View>

                    {/* Message Form */}
                    <View style={styles.formSection}>
                        <Text style={styles.formLabel}>תיאור הבעיה או הבקשה:</Text>
                        <TextInput
                            style={styles.messageInput}
                            placeholder="כתוב כאן מה אתה צריך עזרה בו..."
                            placeholderTextColor="#9ca3af"
                            value={message}
                            onChangeText={setMessage}
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                            textAlign="right"
                        />

                        <Text style={styles.helperText}>
                            ההודעה תישלח ישירות לווצאפ של בעל העסק
                        </Text>
                    </View>

                    {/* Send Button */}
                    <Pressable
                        style={[styles.sendButton, loading && styles.sendButtonDisabled]}
                        onPress={handleSendMessage}
                        disabled={loading}
                    >
                        <MaterialCommunityIcons name="whatsapp" size={20} color="#ffffff" />
                        <Text style={styles.sendButtonText}>
                            {loading ? 'שולח...' : 'שלח לווצאפ'}
                        </Text>
                    </Pressable>

                    {/* Contact Info */}
                    <View style={styles.contactSection}>
                        <Text style={styles.contactTitle}>דרכי יצירת קשר נוספים:</Text>

                        <View style={styles.contactItem}>
                            <MaterialCommunityIcons name="phone" size={20} color="#6b7280" />
                            <Text style={styles.contactText}>טלפון: 052-652-5185</Text>
                        </View>

                        <View style={styles.contactItem}>
                            <MaterialCommunityIcons name="email" size={20} color="#6b7280" />
                            <Text style={styles.contactText}>אימייל: info@oshribarber.com</Text>
                        </View>

                        <View style={styles.contactItem}>
                            <MaterialCommunityIcons name="map-marker" size={20} color="#6b7280" />
                            <Text style={styles.contactText}>כתובת: יוסי בנאי 10, רמלה</Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeScreen>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    backText: {
        fontSize: 16,
        color: '#111827',
        marginRight: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        flex: 1,
        textAlign: 'center',
        marginRight: 40, // כדי לאזן עם כפתור החזרה
    },
    content: {
        padding: 16,
        gap: 24,
    },
    infoSection: {
        alignItems: 'center',
        paddingVertical: 24,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        paddingHorizontal: 20,
    },
    infoTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
        marginTop: 16,
        marginBottom: 8,
    },
    infoText: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 24,
    },
    formSection: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 20,
    },
    formLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
        textAlign: 'right',
    },
    messageInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 16,
        fontSize: 16,
        color: '#111827',
        backgroundColor: '#f9fafb',
        minHeight: 120,
    },
    helperText: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 8,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    sendButton: {
        backgroundColor: '#25d366', // צבע ווצאפ
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
        backgroundColor: '#9ca3af',
        shadowOpacity: 0.1,
    },
    sendButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '600',
    },
    contactSection: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 20,
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
