import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import config from '../../config';
import notificationManager from '../../lib/notificationManager';
import tokenManager from '../../lib/tokenManager';
import SafeScreen from '../components/SafeScreen';



export default function Index() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [emailFocused, setEmailFocused] = useState(false)
    const [passwordFocused, setPasswordFocused] = useState(false)


    const onSubmit = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please enter email and password.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${config.BASE_URL}/users/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
            });
            const data = await res.json();
            console.log('Server response:', data);

            if (!res.ok) {
                Alert.alert("Error", data?.error || "Login failed");
            }
            else {
                // Store tokens and user info (API returns user object)
                const accessToken = data.tokens?.accessToken || data.accessToken;
                const refreshToken = data.tokens?.refreshToken || data.refreshToken;
                const userId = data.user?.id || data.user?._id || data.userId || data._id || data.id;
                const role = data.user?.role || data.role;

                console.log('Extracted values:', { accessToken, refreshToken, userId, role });

                if (accessToken && refreshToken) {
                    await AsyncStorage.setItem("accessToken", accessToken);
                    await AsyncStorage.setItem("refreshToken", refreshToken);

                    // Only save userId and role if they exist
                    if (userId) {
                        await AsyncStorage.setItem("userId", userId);
                    }
                    if (role) {
                        await AsyncStorage.setItem("role", role);
                    }

                    // Register for push notifications
                    try {
                        await notificationManager.registerForPushNotificationsAsync();
                    } catch (error) {
                        console.log('Error registering for notifications:', error);
                    }

                    // מתחיל את מערכת הרענון האוטומטי של הטוקנים
                    tokenManager.startAutoRefresh();

                    Alert.alert("Success", "Logged in successfully!");

                    // Navigate based on role - use simpler paths that likely exist
                    if (role === "barber") {
                        router.replace("/(barberTabs)/Dashboard");
                    } else {
                        router.replace("/(customerTabs)");
                    }
                } else {
                    Alert.alert("Error", "Invalid response from server");
                }
            }
        } catch (e) {
            Alert.alert("Error", e instanceof Error ? e.message : "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeScreen>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView
                    style={styles.container}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>ברוכים הבאים</Text>
                        <Text style={styles.subtitle}>התחברו לחשבון שלכם</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>אימייל</Text>
                            <TextInput
                                placeholder='הזינו את כתובת האימייל שלכם'
                                placeholderTextColor="#999"
                                autoCapitalize='none'
                                keyboardType='email-address'
                                value={email}
                                onChangeText={setEmail}
                                onFocus={() => setEmailFocused(true)}
                                onBlur={() => setEmailFocused(false)}
                                style={[styles.input, emailFocused && styles.inputFocused]}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>סיסמה</Text>
                            <TextInput
                                placeholder='הזינו את הסיסמה שלכם'
                                placeholderTextColor="#999"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                                onFocus={() => setPasswordFocused(true)}
                                onBlur={() => setPasswordFocused(false)}
                                style={[styles.input, passwordFocused && styles.inputFocused]}
                            />
                        </View>

                        <Pressable
                            onPress={onSubmit}
                            disabled={loading}
                            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                        >
                            <Text style={styles.loginButtonText}>
                                {loading ? 'מתחבר...' : 'התחבר'}
                            </Text>
                        </Pressable>

                        <Pressable
                            style={styles.signupLink}
                            onPress={() => router.push('/(auth)/signup')}
                        >
                            <Text style={styles.signupText}>
                                אין לכם חשבון? <Text style={styles.signupLinkText}>הירשמו כאן</Text>
                            </Text>
                        </Pressable>
                    </View>
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
    header: {
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 40,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#cccccc',
        textAlign: 'center',
    },
    form: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 8,
        textAlign: 'right',
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#ffffff',
        textAlign: 'right',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    inputFocused: {
        borderColor: '#d4af37',
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
    },
    loginButton: {
        backgroundColor: '#d4af37',
        borderRadius: 12,
        paddingVertical: 16,
        marginTop: 20,
        shadowColor: '#d4af37',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        color: '#1a1a1a',
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
    signupLink: {
        marginTop: 24,
        alignItems: 'center',
    },
    signupText: {
        fontSize: 14,
        color: '#cccccc',
        textAlign: 'center',
    },
    signupLinkText: {
        color: '#d4af37',
        fontWeight: '600',
    },
});
