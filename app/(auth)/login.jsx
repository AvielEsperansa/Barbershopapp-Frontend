import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import config from '../../config';
import SafeScreen from '../components/SafeScreen';

export default function PhoneLogin() {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [inputFocused, setInputFocused] = useState(false);

    const onSubmit = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const cleanPhone = phone.trim().replace(/-/g, '');
        if (!cleanPhone || cleanPhone.length !== 10 || !cleanPhone.startsWith('05')) {
            Alert.alert('שגיאה', 'אנא הכנס מספר טלפון תקין (10 ספרות המתחיל ב-05)');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${config.BASE_URL}/users/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: cleanPhone })
            });

            const data = await res.json();
            if (!res.ok) {
                Alert.alert('שגיאה', data?.error || 'שליחת קוד אימות נכשלה');
                return;
            }

            // If phone is not registered in the system, alert and prompt to register
            if (data.userExists === false) {
                Alert.alert(
                    'מספר אינו רשום',
                    'מספר הטלפון שהזנת אינו רשום במערכת. האם ברצונך להירשם?',
                    [
                        { text: 'ביטול', style: 'cancel' },
                        {
                            text: 'מעבר להרשמה',
                            onPress: () => {
                                router.push({
                                    pathname: '/(auth)/signup',
                                    params: { phone: cleanPhone }
                                });
                            }
                        }
                    ]
                );
                return;
            }

            // Navigate to OTP verification screen for existing user
            router.push({
                pathname: '/(auth)/otpVerify',
                params: {
                    phone: cleanPhone,
                    isSignup: 'false'
                }
            });
        } catch (e) {
            Alert.alert('שגיאה', e?.message || 'אירעה שגיאה בחיבור לשרת');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeScreen backgroundColor="#09090b">
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView
                    style={styles.container}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    {/* Back Button to Landing */}
                    <Pressable
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.back();
                        }}
                        style={styles.backBtn}
                    >
                        <MaterialCommunityIcons name="arrow-right" size={22} color="#ffffff" />
                        <Text style={styles.backBtnText}>חזרה</Text>
                    </Pressable>

                    <View style={styles.header}>
                        <View style={styles.logoBadge}>
                            <MaterialCommunityIcons name="content-cut" size={40} color="#ef4444" />
                        </View>
                        <Text style={styles.title}>התחברות למערכת ✂️</Text>
                        <Text style={styles.subtitle}>הכנס מספר טלפון לקבלת קוד אימות ב-SMS</Text>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>מספר טלפון נייד</Text>
                            <View style={[styles.phoneInputRow, inputFocused && styles.phoneInputRowFocused]}>
                                <TextInput
                                    placeholder="050-0000000"
                                    placeholderTextColor="#666"
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                    value={phone}
                                    onChangeText={setPhone}
                                    onFocus={() => setInputFocused(true)}
                                    onBlur={() => setInputFocused(false)}
                                    style={styles.input}
                                    textAlign="right"
                                />
                                <View style={styles.countryBadge}>
                                    <Text style={styles.countryBadgeText}>🇮🇱 +972</Text>
                                </View>
                            </View>
                        </View>

                        <Pressable
                            onPress={onSubmit}
                            disabled={loading}
                            style={({ pressed }) => [
                                styles.loginButton,
                                (loading || pressed) && styles.loginButtonDisabled
                            ]}
                        >
                            {loading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <View style={styles.btnContent}>
                                    <Text style={styles.loginButtonText}>שלח קוד אימות ב-SMS</Text>
                                    <MaterialCommunityIcons name="arrow-left" size={20} color="#ffffff" />
                                </View>
                            )}
                        </Pressable>

                        <Pressable
                            style={styles.signupLink}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push('/(auth)/signup');
                            }}
                        >
                            <Text style={styles.signupText}>
                                אין לכם חשבון? <Text style={styles.signupLinkText}>הירשמו כאן</Text>
                            </Text>
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </SafeScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#09090b',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    backBtn: {
        position: 'absolute',
        top: 20,
        right: 20,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        zIndex: 10,
    },
    backBtnText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    header: {
        alignItems: 'center',
        marginBottom: 28,
    },
    logoBadge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderWidth: 1.5,
        borderColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#a1a1aa',
        textAlign: 'center',
    },
    card: {
        backgroundColor: 'rgba(24, 24, 27, 0.9)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
    },
    inputContainer: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#e4e4e7',
        marginBottom: 10,
        textAlign: 'right',
    },
    phoneInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#09090b',
        borderWidth: 1.5,
        borderColor: '#27272a',
        borderRadius: 16,
        paddingHorizontal: 14,
        height: 56,
    },
    phoneInputRowFocused: {
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
    },
    countryBadge: {
        paddingLeft: 10,
        borderLeftWidth: 1,
        borderLeftColor: '#27272a',
    },
    countryBadgeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#a1a1aa',
    },
    input: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
        paddingRight: 10,
    },
    loginButton: {
        backgroundColor: '#dc2626',
        borderRadius: 16,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 5,
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    btnContent: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8,
    },
    loginButtonText: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: 'bold',
    },
    signupLink: {
        marginTop: 20,
        alignItems: 'center',
    },
    signupText: {
        fontSize: 15,
        color: '#a1a1aa',
        textAlign: 'center',
    },
    signupLinkText: {
        color: '#ef4444',
        fontWeight: 'bold',
    },
});
