import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import config from '../../config';
import ImageUploader from '../components/ImageUploader';
import SafeScreen from '../components/SafeScreen';

export default function Signup() {
    const params = useLocalSearchParams();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState(params.phone || '');
    const [loading, setLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    const handleImageUploaded = (imageUrl) => {
        setSelectedImage(imageUrl);
    };

    const validate = () => {
        const cleanPhone = phone.trim().replace(/-/g, '');
        if (!firstName.trim() || !lastName.trim() || !cleanPhone) {
            return 'אנא מלא את כל שדות החובה';
        }
        if (cleanPhone.length !== 10 || !cleanPhone.startsWith('05')) {
            return 'מספר הטלפון חייב להיות בן 10 ספרות ולהתחיל ב-05';
        }
        if (firstName.trim().length < 2 || lastName.trim().length < 2) {
            return 'שם פרטי ושם משפחה חייבים להיות לפחות 2 תווים';
        }
        return null;
    };

    const onSubmit = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const err = validate();
        if (err) {
            Alert.alert('שגיאה', err);
            return;
        }

        const cleanPhone = phone.trim().replace(/-/g, '');

        try {
            setLoading(true);

            // Send OTP via SMS first
            const response = await fetch(`${config.BASE_URL}/users/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: cleanPhone })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.error || 'שליחת קוד אימות נכשלה');
            }

            // Navigate to OTP verification screen with user details
            router.push({
                pathname: '/(auth)/otpVerify',
                params: {
                    phone: cleanPhone,
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    profileImage: selectedImage || '',
                    isSignup: 'true'
                }
            });

        } catch (e) {
            Alert.alert('שגיאה', e.message || 'שליחת קוד אימות נכשלה');
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
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Top Nav */}
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

                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>הרשמה למספרה ✂️</Text>
                            <Text style={styles.subtitle}>צור חשבון חדש בכמה צעדים פשוטים</Text>
                        </View>

                        <View style={styles.card}>
                            {/* Profile Image Section */}
                            <View style={styles.imageSection}>
                                <ImageUploader
                                    currentImage={selectedImage}
                                    onImageUploaded={handleImageUploaded}
                                    size={110}
                                    showOverlay={false}
                                    fileFieldName="profileImage"
                                    placeholderText="תמונת פרופיל"
                                    localOnly={true}
                                />
                            </View>

                            {/* Form Fields */}
                            <View style={styles.form}>
                                <View style={styles.inputRow}>
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>שם פרטי</Text>
                                        <TextInput
                                            placeholder="ישראל"
                                            placeholderTextColor="#64748b"
                                            value={firstName}
                                            onChangeText={setFirstName}
                                            style={styles.input}
                                            textAlign="right"
                                        />
                                    </View>
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>שם משפחה</Text>
                                        <TextInput
                                            placeholder="ישראלי"
                                            placeholderTextColor="#64748b"
                                            value={lastName}
                                            onChangeText={setLastName}
                                            style={styles.input}
                                            textAlign="right"
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>מספר טלפון נייד</Text>
                                    <View style={styles.phoneInputRow}>
                                        <TextInput
                                            placeholder="050-0000000"
                                            placeholderTextColor="#64748b"
                                            keyboardType="phone-pad"
                                            maxLength={10}
                                            value={phone}
                                            onChangeText={setPhone}
                                            style={styles.phoneInput}
                                            textAlign="right"
                                        />
                                        <View style={styles.countryBadge}>
                                            <Text style={styles.countryBadgeText}>🇮🇱 +972</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* Submit Button */}
                            <Pressable
                                onPress={onSubmit}
                                disabled={loading}
                                style={({ pressed }) => [
                                    styles.submitButton,
                                    (loading || pressed) && styles.submitButtonDisabled
                                ]}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#ffffff" />
                                ) : (
                                    <View style={styles.btnContent}>
                                        <Text style={styles.submitButtonText}>המשך לאימות ב-SMS</Text>
                                        <MaterialCommunityIcons name="arrow-left" size={20} color="#ffffff" />
                                    </View>
                                )}
                            </Pressable>

                            {/* Login Link */}
                            <View style={styles.loginLink}>
                                <Text style={styles.loginText}>כבר יש לך חשבון? </Text>
                                <Pressable
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        router.replace('/(auth)/login');
                                    }}
                                >
                                    <Text style={styles.loginLinkText}>התחבר כאן</Text>
                                </Pressable>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </SafeScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#09090b',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 30,
    },
    topNav: {
        marginBottom: 12,
        flexDirection: 'row-reverse',
        justifyContent: 'flex-start',
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
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: '#a1a1aa',
        textAlign: 'center',
    },
    card: {
        backgroundColor: 'rgba(24, 24, 27, 0.9)',
        borderRadius: 24,
        padding: 22,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
    },
    imageSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    form: {
        gap: 16,
        marginBottom: 24,
    },
    inputRow: {
        flexDirection: 'row',
        gap: 12,
    },
    inputContainer: {
        flex: 1,
    },
    inputLabel: {
        color: '#e4e4e7',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'right',
    },
    input: {
        backgroundColor: '#09090b',
        borderWidth: 1.5,
        borderColor: '#27272a',
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 52,
        color: '#ffffff',
        fontSize: 16,
    },
    phoneInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#09090b',
        borderWidth: 1.5,
        borderColor: '#27272a',
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 52,
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
    phoneInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        paddingRight: 10,
    },
    submitButton: {
        backgroundColor: '#dc2626',
        borderRadius: 16,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18,
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 5,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    btnContent: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8,
    },
    submitButtonText: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: 'bold',
    },
    loginLink: {
        flexDirection: 'row-reverse',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginText: {
        color: '#a1a1aa',
        fontSize: 15,
    },
    loginLinkText: {
        color: '#ef4444',
        fontSize: 15,
        fontWeight: 'bold',
    },
});