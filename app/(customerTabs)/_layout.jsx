import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import React from 'react'
import { Platform, StatusBar } from 'react-native'
import SafeScreen from '../components/SafeScreen'

export default function _layout() {
    return (
        <SafeScreen backgroundColor="#09090b" >
            <StatusBar barStyle="light-content" backgroundColor="#09090b" translucent={false} />
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarShowLabel: true,
                    tabBarActiveTintColor: '#ef4444',
                    tabBarInactiveTintColor: '#71717a',
                    tabBarStyle: Platform.select({
                        ios: { position: "absolute", backgroundColor: "#18181b", borderTopColor: "rgba(239, 68, 68, 0.25)", height: 75 },
                        default: { backgroundColor: "#18181b", borderTopColor: "rgba(239, 68, 68, 0.25)", height: 75 },
                    }),
                }}
            >
                <Tabs.Screen name="index" options={{
                    title: "בית",
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="home" color={color} size={size} />
                    ),

                }} />
                <Tabs.Screen
                    name="customerAppointment"
                    options={{
                        title: "תורים",
                        tabBarIcon: ({ color, size }) => (
                            <MaterialCommunityIcons name="calendar" color={color} size={size} />
                        ),
                    }}
                    listeners={({ navigation }) => ({
                        tabPress: () => {
                            navigation.navigate('customerAppointment', { refresh: Date.now() })
                        }
                    })}
                />
                <Tabs.Screen name="customerProfile" options={{
                    title: "פרופיל",
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="account" color={color} size={size} />
                    ),
                }} />
            </Tabs>
        </SafeScreen>
    )
}