import { MaterialCommunityIcons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import React, { useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import config from '../config'
import SafeScreen from './components/SafeScreen'

export default function Security() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const onPasswordChange = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('שגיאה', 'יש למלא את כל השדות')
            return
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('שגיאה', 'הסיסמה החדשה לא תואמת לאישור הסיסמה')
            return
        }

        if (newPassword.length < 6) {
            Alert.alert('שגיאה', 'הסיסמה חייבת להיות לפחות 6 תווים')
            return
        }

        setLoading(true)
        setError('')
        try {
            const accessToken = await AsyncStorage.getItem('accessToken')
            const res = await fetch(`${config.BASE_URL}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error || 'Failed to update password')

            if (json.message === 'Profile updated successfully') {
                Alert.alert('הצלחה', 'הסיסמה שונתה בהצלחה')
                // ניקוי השדות
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
            } else {
                throw new Error('Unexpected response format')
            }
        } catch (e) {
            Alert.alert('שגיאה', e instanceof Error ? e.message : 'אירעה שגיאה בשינוי הסיסמה')
        } finally {
            setLoading(false)
        }
    }


    const SecurityRow = ({ icon, title, subtitle, onPress, danger, children }) => (
        <View style={styles.row}>
            <View style={styles.rowLeft}>
                <MaterialCommunityIcons name={icon} size={22} color={danger ? '#ef4444' : '#ef4444'} />
                <View>
                    <Text style={[styles.rowTitle, danger && styles.rowTitleDanger]}>{title}</Text>
                    {!!subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
                </View>
            </View>
            {children}
        </View>
    )

    return (
        <SafeScreen backgroundColor="#09090b">
            <ScrollView style={{ backgroundColor: "#09090b" }} contentContainerStyle={styles.container}>
                {/* Glowing Red Background Orbs */}
                <View style={styles.orbTopRight} />
                <View style={styles.orbBottomLeft} />

                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-right" size={24} color="#ef4444" />
                    </Pressable>
                    <Text style={styles.title}>הגדרות אבטחה</Text>
                </View>

                {!!error && <Text style={styles.error}>{error}</Text>}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>שינוי סיסמה</Text>

                    <View style={styles.field}>
                        <Text style={styles.label}>סיסמה נוכחית</Text>
                        <TextInput
                            style={styles.input}
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            secureTextEntry
                            placeholder="הזן סיסמה נוכחית"
                            placeholderTextColor="#71717a"
                            textAlign="right"
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>סיסמה חדשה</Text>
                        <TextInput
                            style={styles.input}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry
                            placeholder="לפחות 6 תווים"
                            placeholderTextColor="#71717a"
                            textAlign="right"
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>אישור סיסמה חדשה</Text>
                        <TextInput
                            style={styles.input}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            placeholder="הזן סיסמה חדשה שוב"
                            placeholderTextColor="#71717a"
                            textAlign="right"
                        />
                    </View>

                    <Pressable style={styles.saveButton} onPress={onPasswordChange} disabled={loading}>
                        <Text style={styles.saveButtonText}>{loading ? 'עדכון...' : 'עדכן סיסמה'}</Text>
                    </Pressable>
                </View>

            </ScrollView>
        </SafeScreen>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        gap: 16,
        backgroundColor: '#09090b',
        paddingBottom: 100
    },
    orbTopRight: {
        position: 'absolute',
        top: -60,
        right: -60,
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
    },
    orbBottomLeft: {
        position: 'absolute',
        bottom: -60,
        left: -60,
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: 'rgba(220, 38, 38, 0.08)',
    },
    header: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8
    },
    backButton: {
        padding: 8
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#ffffff',
        flex: 1,
        textAlign: 'right'
    },
    error: {
        color: '#ef4444',
        textAlign: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)'
    },
    section: {
        backgroundColor: 'rgba(24, 24, 27, 0.85)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)',
        overflow: 'hidden',
        gap: 16
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
        paddingHorizontal: 16,
        paddingTop: 16,
        textAlign: 'right'
    },
    field: {
        gap: 6,
        paddingHorizontal: 16
    },
    label: {
        color: '#a1a1aa',
        textAlign: 'right',
        fontWeight: '500'
    },
    input: {
        backgroundColor: '#27272a',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: '#ffffff'
    },
    saveButton: {
        backgroundColor: '#dc2626',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 16,
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
        elevation: 3,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16
    },
    row: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: 'rgba(39, 39, 42, 0.8)'
    },
    rowLeft: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 10
    },
    rowTitle: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 16
    },
    rowTitleDanger: {
        color: '#ef4444'
    },
    rowSubtitle: {
        color: '#6b7280',
        fontSize: 14
    }
})
