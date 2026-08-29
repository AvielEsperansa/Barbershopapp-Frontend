import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import React from 'react'
import { Platform } from 'react-native'
import SafeScreen from '../components/SafeScreen'

export default function _layout() {
    return (
        <SafeScreen backgroundColor="#0f172a" statusBarStyle="light">
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarShowLabel: true,
                    tabBarActiveTintColor: '#3b82f6',
                    tabBarInactiveTintColor: '#64748b',
                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontWeight: '600',
                    },
                    tabBarStyle: Platform.select({
                        ios: {
                            position: 'absolute',
                            backgroundColor: '#0f172a',
                            borderTopColor: 'rgba(59, 130, 246, 0.15)',
                            borderTopWidth: 1,
                            height: 80,
                            paddingBottom: 22,
                            paddingTop: 8,
                        },
                        default: {
                            backgroundColor: '#0f172a',
                            borderTopColor: 'rgba(59, 130, 246, 0.15)',
                            borderTopWidth: 1,
                            height: 68,
                            paddingBottom: 10,
                            paddingTop: 8,
                        },
                    }),
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