import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';

const API_URL = 'http://172.20.10.3:4000'
console.log('API_URL:', API_URL)

// Register for push notifications and send token to backend
async function registerForPushNotificationsAsync(accessToken) {
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.warn('📵 Notification permission not granted');
            return;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: 'fbc9882c-5a50-4890-ac90-04995b12cff7',
        });

        const pushToken = tokenData.data;

        console.log('📱 Expo Push Token:', pushToken);

        await fetch(`${API_URL}/notifications/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ token: pushToken }),
        });
    } catch (error) {
        console.error('❌ Error registering push token:', error);
    }
}

export default function Index() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [emailFocused, setEmailFocused] = useState(false)
    const [passwordFocused, setPasswordFocused] = useState(false)

    const refreshAccessToken = async () => {
        try {
            console.log("🔄 Refreshing access token...");
            const refreshToken = await AsyncStorage.getItem("refreshToken");

            if (!refreshToken) {
                console.warn("⚠️ No refresh token found, redirecting to login...");
                return false;
            }

            const response = await fetch(`${API_URL}/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log("✅ Token refreshed successfully!");
                await AsyncStorage.setItem("accessToken", data.accessToken);
                return true;
            } else {
                console.warn("⚠️ Refresh token expired, user must log in again.");
                await AsyncStorage.removeItem("accessToken");
                await AsyncStorage.removeItem("refreshToken");
                return false;
            }
        } catch (error) {
            console.error("❌ Error refreshing token:", error);
            return false;
        }
    };
    const onSubmit = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please enter email and password.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/users/login`, {
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
                // Store tokens - check if they're nested in 'tokens' or directly in 'data'
                const accessToken = data.tokens?.accessToken || data.accessToken;
                const refreshToken = data.tokens?.refreshToken || data.refreshToken;
                const userId = data.userId || data._id || data.id;
                const role = data.role;

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
                    await registerForPushNotificationsAsync(accessToken);

                    Alert.alert("Success", "Logged in successfully!");

                    // Navigate based on role - use simpler paths that likely exist
                    if (role === "barber") {
                        router.replace("/(barberTabs)");
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
        <View style={styles.container}>
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
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        paddingTop: StatusBar.currentHeight || 0,
    },
    header: {
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
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
        color: '#374151',
        marginBottom: 8,
        textAlign: 'right',
    },
    input: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#1e293b',
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
        borderColor: '#3b82f6',
        shadowColor: '#3b82f6',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    loginButton: {
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        paddingVertical: 16,
        marginTop: 20,
        shadowColor: '#3b82f6',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    loginButtonDisabled: {
        backgroundColor: '#94a3b8',
        shadowOpacity: 0.1,
    },
    loginButtonText: {
        color: '#ffffff',
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
        color: '#64748b',
        textAlign: 'center',
    },
    signupLinkText: {
        color: '#3b82f6',
        fontWeight: '600',
    },
});
