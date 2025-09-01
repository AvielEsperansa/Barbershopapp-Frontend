import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import React from 'react'
import { Platform } from 'react-native'

export default function _layout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: true,
                tabBarStyle: Platform.select({
                    ios: { backgroundColor: "white", height: 75, paddingBottom: 20 },
                    default: { backgroundColor: "white", height: 75, paddingBottom: 20 },
                }),
            }}
        >
            <Tabs.Screen name="Dashboard" options={{
                title: "דשבורד",
                tabBarIcon: ({ color, size }) => (
                    <MaterialCommunityIcons name="home" color={color} size={size} />
                ),

            }} />
            <Tabs.Screen name="Appointments" options={{
                title: "תורים",
                tabBarIcon: ({ color, size }) => (
                    <MaterialCommunityIcons name="calendar" color={color} size={size} />
                ),
            }} />
            <Tabs.Screen name="barberProfile" options={{
                title: "פרופיל",
                tabBarIcon: ({ color, size }) => (
                    <MaterialCommunityIcons name="account" color={color} size={size} />
                ),
            }} />
        </Tabs>
    )
}