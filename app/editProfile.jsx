import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import config from '../config'

export default function EditProfile() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')

    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true)
            setError('')
            try {
                const accessToken = await AsyncStorage.getItem('accessToken')
                const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
                const res = await fetch(`${config.BASE_URL}/users/profile`, { headers })
                const json = await res.json()
                if (!res.ok) throw new Error(json?.error || 'Failed to load profile')
                const u = json.user || json
                setFirstName(u.firstName || '')
                setLastName(u.lastName || '')
                setEmail(u.email || '')
                setPhone(u.phone || '')
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to load profile')
            } finally {
                setLoading(false)
            }
        }
        loadProfile()
    }, [])

    const onSave = async () => {
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
                    firstName,
                    lastName,
                    email,
                    phone
                })
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error || 'Failed to update profile')

            // בדיקה שהבקנד החזיר הודעה על הצלחה
            if (json.message === 'Profile updated successfully') {
                Alert.alert('הצלחה', 'הפרטים עודכנו בהצלחה')
                router.back()
            } else {
                throw new Error('Unexpected response format')
            }
        } catch (e) {
            Alert.alert('שגיאה', e instanceof Error ? e.message : 'אירעה שגיאה בעדכון הפרופיל')
        } finally {
            setLoading(false)
        }
    }

    return (
        <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 24 }]}>
            <Text style={styles.title}>עריכת פרטים</Text>
            {!!error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.field}>
                <Text style={styles.label}>שם פרטי</Text>
                <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="ישראל" textAlign="right" />
            </View>
            <View style={styles.field}>
                <Text style={styles.label}>שם משפחה</Text>
                <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="ישראלי" textAlign="right" />
            </View>
            <View style={styles.field}>
                <Text style={styles.label}>אימייל</Text>
                <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" textAlign="right" />
            </View>
            <View style={styles.field}>
                <Text style={styles.label}>טלפון</Text>
                <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="050-1234567" keyboardType="phone-pad" textAlign="right" />
            </View>

            <Pressable disabled={loading} onPress={onSave} style={[styles.saveButton, loading && { opacity: 0.7 }]}>
                <Text style={styles.saveButtonText}>שמירה</Text>
            </Pressable>
            <Pressable disabled={loading} onPress={() => router.back()} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>ביטול</Text>
            </Pressable>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        gap: 14,
        backgroundColor: '#f8fafc'
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'right',
        marginBottom: 8
    },
    error: {
        color: '#b91c1c',
        textAlign: 'center'
    },
    field: {
        gap: 6
    },
    label: {
        color: '#6b7280',
        textAlign: 'right'
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10
    },
    saveButton: {
        backgroundColor: '#111827',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '700'
    },
    cancelButton: {
        backgroundColor: '#f3f4f6',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 8
    },
    cancelButtonText: {
        color: '#111827',
        fontWeight: '600'
    }
})


