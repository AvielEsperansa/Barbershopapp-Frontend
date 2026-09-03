import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import React from 'react'
import { Platform, StatusBar } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import SafeScreen from '../components/SafeScreen'

export default function _layout() {
    const insets = useSafeAreaInsets()
    const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 0)

    return (
        <SafeScreen backgroundColor="#09090b" statusBarStyle="light" paddingBottom={0}>
            <StatusBar barStyle="light-content" backgroundColor="#09090b" translucent={false} />
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarShowLabel: true,
                    tabBarActiveTintColor: '#ef4444',
                    tabBarInactiveTintColor: '#71717a',
                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontWeight: '600',
                        marginBottom: Platform.OS === 'android' ? 4 : 0,
                    },
                    tabBarStyle: {
                        backgroundColor: '#18181b',
                        borderTopColor: 'rgba(239, 68, 68, 0.25)',
                        borderTopWidth: 1,
                        height: 60 + bottomInset,
                        paddingBottom: bottomInset > 0 ? bottomInset : 8,
                        paddingTop: 8,
                    },
                }}
            >
                <Tabs.Screen name="Dashboard" options={{
                    title: "דשבורד",
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />
                    ),
                }} />
                <Tabs.Screen name="Appointments" options={{
                    title: "תורים",
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="calendar-clock" color={color} size={size} />
                    ),
                }} />
                <Tabs.Screen name="Customers" options={{
                    title: "לקוחות",
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="account-group" color={color} size={size} />
                    ),
                }} />
                <Tabs.Screen name="barberProfile" options={{
                    title: "פרופיל",
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="account-circle" color={color} size={size} />
                    ),
                }} />
            </Tabs>
        </SafeScreen>
    )
}