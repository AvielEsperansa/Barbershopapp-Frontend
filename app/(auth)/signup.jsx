import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
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
import notificationManager from '../../lib/notificationManager';
import tokenManager from '../../lib/tokenManager';
import ImageUploader from '../components/ImageUploader';
import SafeScreen from '../components/SafeScreen';

export default function Signup() {
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [selectedImage, setSelectedImage] = useState(null)

    const handleImageUploaded = (imageUrl) => {
        setSelectedImage(imageUrl);
    };

    const validate = () => {
        if (!email || !password || !firstName || !lastName || !phone) return 'כל השדות נדרשים'
        if (!email.includes('@')) return 'אימייל לא תקין'
        if (password.length < 8) return 'הסיסמה חייבת להיות לפחות 8 תווים'
        if (phone.length !== 10) return 'מספר הטלפון חייב להיות 10 ספרות'
        if (!phone.startsWith('05')) return 'מספר הטלפון חייב להתחיל ב-05'
        if (firstName.length < 3 || lastName.length < 3) return 'השם הפרטי ושם המשפחה חייבים להיות לפחות 3 תווים'
        return null
    }

    const onSubmit = async () => {
        const err = validate()
        if (err) {
            Alert.alert('שגיאה', err)
            return
        }
        try {
            setLoading(true)

            // יצירת FormData אם יש תמונה
            let requestBody;
            let headers;

            if (selectedImage) {
                const formData = new FormData();
                formData.append('firstName', firstName);
                formData.append('lastName', lastName);
                formData.append('email', email);
                formData.append('phone', phone);
                formData.append('password', password);

                // הוספת התמונה
                const imageUri = selectedImage;
                const imageName = imageUri.split('/').pop();
                formData.append('profileImage', {
                    uri: imageUri,
                    type: 'image/jpeg',
                    name: imageName
                });

                requestBody = formData;
                headers = { 'Content-Type': 'multipart/form-data' };
            } else {
                requestBody = JSON.stringify({ firstName, lastName, email, phone, password });
                headers = { 'Content-Type': 'application/json' };
            }

            const response = await fetch(`${config.BASE_URL}/users/register`, {
                method: 'POST',
                headers,
                body: requestBody
            })

            const isJson = (response.headers.get('content-type') || '').includes('application/json')
            const data = isJson ? await response.json() : await response.text()

            if (!response.ok) {
                const message = isJson ? (data?.error || data?.message || 'ההרשמה נכשלה') : (data || 'ההרשמה נכשלה')
                throw new Error(message)
            }

            // בדיקה שהבקנד החזיר token
            if (data.accessToken) {
                // שמירת ה-token
                await AsyncStorage.setItem('accessToken', data.accessToken)
                if (data.refreshToken) {
                    await AsyncStorage.setItem('refreshToken', data.refreshToken)
                }

                // מתחיל את מערכת הרענון האוטומטי של הטוקנים
                tokenManager.startAutoRefresh();

                // רישום להתראות push
                try {
                    await notificationManager.registerForPushNotificationsAsync();
                } catch (error) {
                    console.log('Error registering for notifications:', error);
                }

                Alert.alert('הצלחה', 'המשתמש נרשם בהצלחה! מתחבר אוטומטית...', [
                    {
                        text: 'אישור',
                        onPress: () => {
                            router.replace('/(customerTabs)')
                        }
                    }
                ])
            } else {
                // אם אין token, מעביר לדף התחברות
                Alert.alert('הצלחה', 'המשתמש נרשם בהצלחה! אנא התחבר', [
                    {
                        text: 'אישור',
                        onPress: () => router.replace('/(auth)/index')
                    }
                ])
            }
        } catch (e) {
            Alert.alert('שגיאה', e.message || 'ההרשמה נכשלה')
        } finally {
            setLoading(false)
        }
    }

    return (
        <SafeScreen>
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
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>הרשמה</Text>
                            <Text style={styles.subtitle}>צור חשבון חדש</Text>
                        </View>

                        {/* Profile Image Section */}
                        <View style={styles.imageSection}>
                            <ImageUploader
                                currentImage={selectedImage}
                                onImageUploaded={handleImageUploaded}
                                size={120}
                                showOverlay={true}
                                placeholderText="הוסף תמונת פרופיל"
                                localOnly={true}
                            />
                        </View>

                        {/* Form Fields */}
                        <View style={styles.form}>
                            <View style={styles.inputRow}>
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>שם פרטי</Text>
                                    <TextInput
                                        placeholder='הכנס שם פרטי'
                                        value={firstName}
                                        onChangeText={setFirstName}
                                        style={styles.input}
                                        textAlign="right"
                                    />
                                </View>
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>שם משפחה</Text>
                                    <TextInput
                                        placeholder='הכנס שם משפחה'
                                        value={lastName}
                                        onChangeText={setLastName}
                                        style={styles.input}
                                        textAlign="right"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>אימייל</Text>
                                <TextInput
                                    placeholder='הכנס אימייל'
                                    autoCapitalize='none'
                                    keyboardType='email-address'
                                    value={email}
                                    onChangeText={setEmail}
                                    style={styles.input}
                                    textAlign="right"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>מספר טלפון</Text>
                                <TextInput
                                    placeholder='05xxxxxxxx'
                                    keyboardType='phone-pad'
                                    value={phone}
                                    onChangeText={setPhone}
                                    style={styles.input}
                                    textAlign="right"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>סיסמה</Text>
                                <TextInput
                                    placeholder='הכנס סיסמה'
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                    style={styles.input}
                                    textAlign="right"
                                />
                            </View>
                        </View>

                        {/* Submit Button */}
                        <Pressable
                            onPress={onSubmit}
                            disabled={loading}
                            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        >
                            <Text style={styles.submitButtonText}>
                                {loading ? 'שולח...' : 'צור חשבון'}
                            </Text>
                        </Pressable>

                        {/* Login Link */}
                        <View style={styles.loginLink}>
                            <Text style={styles.loginText}>כבר יש לך חשבון? </Text>
                            <Pressable onPress={() => router.replace('/(auth)/')}>
                                <Text style={styles.loginLinkText}>התחבר כאן</Text>
                            </Pressable>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </SafeScreen>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        paddingTop: -20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#cccccc',
        textAlign: 'center',
    },
    imageSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    form: {
        gap: 20,
        marginBottom: 30,
    },
    inputRow: {
        flexDirection: 'row',
        gap: 12,
    },
    inputContainer: {
        flex: 1,
    },
    inputLabel: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'right',
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        padding: 16,
        color: '#ffffff',
        fontSize: 16,
    },
    submitButton: {
        backgroundColor: '#d4af37',
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#d4af37',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#1a1a1a',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loginLink: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginText: {
        color: '#cccccc',
        fontSize: 16,
    },
    loginLinkText: {
        color: '#d4af37',
        fontSize: 16,
        fontWeight: '600',
    },
});