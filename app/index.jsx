import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect, router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import tokenManager from '../lib/tokenManager';
import SafeScreen from './components/SafeScreen';

export default function RootIndex() {
    const [targetRoute, setTargetRoute] = useState(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const authPromise = tokenManager.isLoggedInSilent();
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Auth check timeout')), 3000)
                );

                const loggedIn = await Promise.race([authPromise, timeoutPromise]);

                if (loggedIn) {
                    const role = await AsyncStorage.getItem('role');
                    if (role === 'barber') {
                        setTargetRoute('/(barberTabs)/Dashboard');
                    } else {
                        setTargetRoute('/(customerTabs)');
                    }
                } else {
                    setTargetRoute('/(auth)');
                }
            } catch (error) {
                setTargetRoute('/(auth)');
            } finally {
                setChecking(false);
            }
        };

        checkAuth();
    }, []);

    if (checking || !targetRoute) {
        return (
            <SafeScreen backgroundColor="#09090b">
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ef4444" />
                </View>
            </SafeScreen>
        );
    }

    return <Redirect href={targetRoute} />;
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#09090b',
    },
});
