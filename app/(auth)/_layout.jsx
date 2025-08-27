import { Stack } from 'expo-router'
import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import SafeScreen from '../components/SafeScreen'

export default function AuthLayout() {
    return (
        <SafeAreaProvider>
            <SafeScreen>
                <Stack screenOptions={{ headerShown: false }} />
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="signup" options={{ headerShown: false }} />
            </SafeScreen>
        </SafeAreaProvider>
    )
}