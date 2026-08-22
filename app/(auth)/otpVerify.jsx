import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
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
import notificationManager from '../../lib/notificationManager';
import tokenManager from '../../lib/tokenManager';
import SafeScreen from '../components/SafeScreen';

export default function OTPVerify() {
    const params = useLocalSearchParams();
    const { phone, isSignup, firstName, lastName, profileImage } = params;

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(60);
    const [resending, setResending] = useState(false);

    useEffect(() => {
        let interval = null;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer(prev => prev - 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [resendTimer]);

    const handleResendOTP = async () => {
        if (resendTimer > 0 || resending) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        try {
            setResending(true);
            const response = await fetch(`${config.BASE_URL}/users/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.error || 'נכשל לשלוח קוד חדש');
            }
            Alert.alert('הצלחה', 'קוד חדש נשלח אליך ב-SMS');
            setResendTimer(60);
        } catch (error) {
            Alert.alert('שגיאה', error.message || 'אירעה שגיאה בשליחת הקוד');
        } finally {
            setResending(false);
        }
    };

    const handleVerify = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const cleanCode = code.trim();
        if (cleanCode.length !== 6) {
            Alert.alert('שגיאה', 'אנא הכנס קוד אימות בת 6 ספרות');
            return;
        }

        try {
            setLoading(true);

            // 1. Verify OTP with Backend
            const verifyRes = await fetch(`${config.BASE_URL}/users/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, code: cleanCode })
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok) {
                throw new Error(verifyData?.error || 'קוד האימות שגוי');
            }

            // 2. If Signup Flow -> Register the user profile
            if (isSignup === 'true') {
                let requestBody;
                let headers;

                if (profileImage) {
                    const formData = new FormData();
                    formData.append('firstName', firstName || '');
                    formData.append('lastName', lastName || '');
                    formData.append('phone', phone);

                    const imageUri = profileImage;
                    const imageName = imageUri.split('/').pop() || 'profile.jpg';
                    formData.append('profileImage', {
                        uri: imageUri,
                        type: 'image/jpeg',
                        name: imageName
                    });

                    requestBody = formData;
                    headers = { 'Content-Type': 'multipart/form-data' };
                } else {
                    requestBody = JSON.stringify({
                        firstName: firstName || '',
                        lastName: lastName || '',
                        phone
                    });
                    headers = { 'Content-Type': 'application/json' };
                }

                const regRes = await fetch(`${config.BASE_URL}/users/register`, {
                    method: 'POST',
                    headers,
                    body: requestBody
                });

                const regData = await regRes.json();
                if (!regRes.ok) {
                    throw new Error(regData?.error || 'הרשמת המשתמש נכשלה');
                }

                const accessToken = regData.accessToken;
                const refreshToken = regData.refreshToken;
                const role = regData.user?.role || 'customer';
                const userId = regData.user?._id || regData.user?.id;

                if (accessToken && refreshToken) {
                    await AsyncStorage.setItem('accessToken', accessToken);
                    await AsyncStorage.setItem('refreshToken', refreshToken);
                    if (userId) await AsyncStorage.setItem('userId', userId);
                    if (role) await AsyncStorage.setItem('role', role);

                    tokenManager.startAutoRefresh();
                    try {
                        await notificationManager.registerForPushNotificationsAsync();
                    } catch (err) {
                        console.log('Push register error:', err);
                    }

                    Alert.alert('הצלחה', 'נרשמת בהצלחה! מתחבר...', [
                        {
                            text: 'אישור',
                            onPress: () => {
                                if (role === 'barber') {
                                    router.replace('/(barberTabs)/Dashboard');
                                } else {
                                    router.replace('/(customerTabs)');
                                }
                            }
                        }
                    ]);
                }
            }
            // 3. Existing User Login Flow
            else if (verifyData.isExistingUser && verifyData.accessToken) {
                const accessToken = verifyData.accessToken;
                const refreshToken = verifyData.refreshToken;
                const role = verifyData.user?.role || 'customer';
                const userId = verifyData.user?._id || verifyData.user?.id;

                await AsyncStorage.setItem('accessToken', accessToken);
                await AsyncStorage.setItem('refreshToken', refreshToken);
                if (userId) await AsyncStorage.setItem('userId', userId);
                if (role) await AsyncStorage.setItem('role', role);

                tokenManager.startAutoRefresh();
                try {
                    await notificationManager.registerForPushNotificationsAsync();
                } catch (err) {
                    console.log('Push register error:', err);
                }

                if (role === 'barber') {
                    router.replace('/(barberTabs)/Dashboard');
                } else {
                    router.replace('/(customerTabs)');
                }
            } else {
                // If user doesn't exist yet, redirect to signup with phone pre-filled
                Alert.alert('משתמש חדש', 'מספר הטלפון אומת. אנא השלם את פרטי ההרשמה', [
                    {
                        text: 'המשך להרשמה',
                        onPress: () => {
                            router.replace({
                                pathname: '/(auth)/signup',
                                params: { phone }
                            });
                        }
                    }
                ]);
            }
        } catch (error) {
            Alert.alert('שגיאה באימות', error.message || 'אימות הקוד נכשל');
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
                    <View style={styles.topNav}>
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
                    </View>

                    <View style={styles.header}>
                        <View style={styles.iconCircle}>
                            <MaterialCommunityIcons name="message-lock-outline" size={38} color="#ef4444" />
                        </View>
                        <Text style={styles.title}>קוד אימות SMS</Text>
                        <Text style={styles.subtitle}>
                            הזן את 6 הספרות שנשלחו למספר:{'\n'}
                            <Text style={styles.phoneHighlight}>{phone}</Text>
                        </Text>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.inputContainer}>
                            <TextInput
                                placeholder="000000"
                                placeholderTextColor="#52525b"
                                keyboardType="number-pad"
                                maxLength={6}
                                value={code}
                                onChangeText={(val) => {
                                    setCode(val);
                                    if (val.length === 6) {
                                        Haptics.selectionAsync();
                                    }
                                }}
                                style={styles.input}
                                textAlign="center"
                            />
                        </View>

                        <Pressable
                            onPress={handleVerify}
                            disabled={loading || code.trim().length !== 6}
                            style={({ pressed }) => [
                                styles.submitButton,
                                (loading || code.trim().length !== 6 || pressed) && styles.submitButtonDisabled
                            ]}
                        >
                            {loading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <Text style={styles.submitButtonText}>אימות והתחברות ➜</Text>
                            )}
                        </Pressable>

                        <View style={styles.resendContainer}>
                            {resendTimer > 0 ? (
                                <View style={styles.timerBadge}>
                                    <MaterialCommunityIcons name="clock-outline" size={16} color="#a1a1aa" />
                                    <Text style={styles.timerText}>
                                        שליחה חוזרת בעוד {resendTimer} שניות
                                    </Text>
                                </View>
                            ) : (
                                <Pressable onPress={handleResendOTP} disabled={resending}>
                                    <Text style={styles.resendLink}>
                                        {resending ? 'שולח...' : 'לא קיבלת קוד? לחץ לשליחה חוזרת'}
                                    </Text>
                                </Pressable>
                            )}
                        </View>
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
        paddingHorizontal: 20,
        justifyContent: 'center',
    },
    topNav: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 10,
    },
    backBtn: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
    iconCircle: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderWidth: 1.5,
        borderColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: '#a1a1aa',
        textAlign: 'center',
        lineHeight: 22,
    },
    phoneHighlight: {
        color: '#ef4444',
        fontWeight: 'bold',
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
    input: {
        backgroundColor: '#09090b',
        borderWidth: 1.5,
        borderColor: '#ef4444',
        borderRadius: 16,
        paddingVertical: 16,
        fontSize: 30,
        fontWeight: 'bold',
        color: '#ffffff',
        letterSpacing: 12,
    },
    submitButton: {
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
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: 'bold',
    },
    resendContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    timerBadge: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 6,
    },
    timerText: {
        color: '#a1a1aa',
        fontSize: 14,
    },
    resendLink: {
        color: '#ef4444',
        fontSize: 15,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
});
