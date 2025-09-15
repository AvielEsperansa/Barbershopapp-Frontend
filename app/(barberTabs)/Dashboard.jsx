import { MaterialCommunityIcons } from '@expo/vector-icons'
import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import SafeScreen from '../components/SafeScreen'

export default function Dashboard() {
    return (
        <SafeScreen paddingTop={5}>
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <MaterialCommunityIcons name="home" size={48} color="#3b82f6" />
                    <Text style={styles.title}>דשבורד הברבר</Text>
                    <Text style={styles.subtitle}>ברוך הבא למערכת ניהול הספר</Text>
                </View>

                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <MaterialCommunityIcons name="calendar-check" size={32} color="#10b981" />
                        <Text style={styles.statNumber}>12</Text>
                        <Text style={styles.statLabel}>תורים היום</Text>
                    </View>

                    <View style={styles.statCard}>
                        <MaterialCommunityIcons name="clock-outline" size={32} color="#f59e0b" />
                        <Text style={styles.statNumber}>3</Text>
                        <Text style={styles.statLabel}>ממתינים</Text>
                    </View>

                    <View style={styles.statCard}>
                        <MaterialCommunityIcons name="star" size={32} color="#8b5cf6" />
                        <Text style={styles.statNumber}>4.8</Text>
                        <Text style={styles.statLabel}>דירוג ממוצע</Text>
                    </View>
                </View>

                <View style={styles.quickActions}>
                    <Text style={styles.sectionTitle}>פעולות מהירות</Text>

                    <View style={styles.actionCard}>
                        <MaterialCommunityIcons name="calendar-plus" size={24} color="#3b82f6" />
                        <Text style={styles.actionText}>הוסף זמינות חדשה</Text>
                    </View>

                    <View style={styles.actionCard}>
                        <MaterialCommunityIcons name="account-multiple" size={24} color="#10b981" />
                        <Text style={styles.actionText}>צפה בלקוחות</Text>
                    </View>

                    <View style={styles.actionCard}>
                        <MaterialCommunityIcons name="chart-line" size={24} color="#f59e0b" />
                        <Text style={styles.actionText}>דוחות וסטטיסטיקות</Text>
                    </View>
                </View>
            </ScrollView>
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
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 24,
        gap: 12
    },
    statCard: {
        flex: 1,
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginTop: 8,
        marginBottom: 4
    },
    statLabel: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center'
    },
    quickActions: {
        paddingHorizontal: 16
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 16,
        textAlign: 'right'
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        gap: 12
    },
    actionText: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '500'
    }
})