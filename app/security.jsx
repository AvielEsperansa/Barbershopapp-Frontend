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
                <MaterialCommunityIcons name={icon} size={22} color={danger ? '#b91c1c' : '#111827'} />
                <View>
                    <Text style={[styles.rowTitle, danger && styles.rowTitleDanger]}>{title}</Text>
                    {!!subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
                </View>
            </View>
            {children}
        </View>
    )

    return (
        <SafeScreen backgroundColor="#f8fafc">
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-right" size={24} color="#111827" />
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
                            placeholder="הכנס סיסמה נוכחית"
                            secureTextEntry
                            textAlign="right"
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>סיסמה חדשה</Text>
                        <TextInput
                            style={styles.input}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholder="הכנס סיסמה חדשה"
                            secureTextEntry
                            textAlign="right"
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>אישור סיסמה חדשה</Text>
                        <TextInput
                            style={styles.input}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="הכנס שוב את הסיסמה החדשה"
                            secureTextEntry
                            textAlign="right"
                        />
                    </View>

                    <Pressable
                        disabled={loading}
                        onPress={onPasswordChange}
                        style={[styles.saveButton, loading && { opacity: 0.7 }]}
                    >
                        <Text style={styles.saveButtonText}>שנה סיסמה</Text>
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
        backgroundColor: '#f8fafc'
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
        color: '#111827',
        flex: 1,
        textAlign: 'right'
    },
    error: {
        color: '#b91c1c',
        textAlign: 'center',
        backgroundColor: '#fef2f2',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#fecaca'
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        overflow: 'hidden',
        gap: 16
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        paddingHorizontal: 16,
        paddingTop: 16,
        textAlign: 'right'
    },
    field: {
        gap: 6,
        paddingHorizontal: 16
    },
    label: {
        color: '#6b7280',
        textAlign: 'right',
        fontWeight: '500'
    },
    input: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16
    },
    saveButton: {
        backgroundColor: '#3b82f6',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 16
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
        borderTopColor: '#f3f4f6'
    },
    rowLeft: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 10
    },
    rowTitle: {
        color: '#111827',
        fontWeight: '600',
        fontSize: 16
    },
    rowTitleDanger: {
        color: '#b91c1c'
    },
    rowSubtitle: {
        color: '#6b7280',
        fontSize: 14
    }
})
