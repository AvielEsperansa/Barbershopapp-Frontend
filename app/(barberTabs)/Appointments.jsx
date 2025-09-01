import { MaterialCommunityIcons } from '@expo/vector-icons'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import SafeScreen from '../components/SafeScreen'

export default function Appointments() {
    return (
        <SafeScreen paddingTop={5}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <MaterialCommunityIcons name="calendar" size={48} color="#3b82f6" />
                    <Text style={styles.title}>ניהול תורים</Text>
                    <Text style={styles.subtitle}>צפה וטפל בתורים של הלקוחות</Text>
                </View>

                <View style={styles.content}>
                    <Text style={styles.comingSoon}>בקרוב - ניהול תורים מתקדם</Text>
                    <Text style={styles.description}>
                        כאן תוכל לצפות בתורים, לשנות זמנים ולנהל את הלוח שלך
                    </Text>
                </View>
            </View>
        </SafeScreen>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        paddingBottom: 100
    },
    header: {
        alignItems: 'center',
        paddingVertical: 40,
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        marginBottom: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginTop: 16,
        marginBottom: 8
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center'
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20
    },
    comingSoon: {
        fontSize: 20,
        fontWeight: '600',
        color: '#3b82f6',
        marginBottom: 12,
        textAlign: 'center'
    },
    description: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 24
    }
})
