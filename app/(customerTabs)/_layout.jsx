import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import React from 'react'
import { Platform, StatusBar } from 'react-native'
import SafeScreen from '../components/SafeScreen'

export default function _layout() {
    return (
        <SafeScreen backgroundColor="#f8fafc" >
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarShowLabel: true,
                    tabBarStyle: Platform.select({
                        ios: { position: "absolute", backgroundColor: "white", height: 75 },
                        default: { backgroundColor: "white", height: 75 },
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