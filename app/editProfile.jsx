import AsyncStorage from '@react-native-async-storage/async-storage'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import config from '../config'
import SafeScreen from './components/SafeScreen'

export default function EditProfile() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [phone, setPhone] = useState('')

    const [originalValues, setOriginalValues] = useState({
        firstName: '',
        lastName: '',
        phone: ''
    })

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
                setPhone(u.phone || '')

                setOriginalValues({
                    firstName: u.firstName || '',
                    lastName: u.lastName || '',
                    phone: u.phone || ''
                })
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to load profile')
            } finally {
                setLoading(false)
            }
        }
        loadProfile()
    }, [])

    const onSave = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        const hasChanges =
            firstName !== originalValues.firstName ||
            lastName !== originalValues.lastName

        if (!hasChanges) {
            Alert.alert('מידע', 'לא בוצעו שינויים בפרטים')
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
                    firstName,
                    lastName
                })
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error || 'Failed to update profile')

            if (json.message === 'Profile updated successfully' || json.user) {
                setOriginalValues({
                    firstName,
                    lastName,
                    phone
                })
                Alert.alert('הצלחה', 'הפרטים עודכנו בהצלחה', [
                    {
                        text: 'אישור',
                        onPress: () => {
                            router.navigate({
                                pathname: '/(customerTabs)/customerProfile',
                                params: { refreshed: Date.now().toString() }
                            })
                        }
                    }
                ])
            } else {
                throw new Error('Unexpected response format')
            }
        } catch (e) {
            Alert.alert('שגיאה', e instanceof Error ? e.message : 'אירעה שגיאה בעדכון הפרופיל')
        } finally {
            setLoading(false)
        }
    }

    const hasUnsavedChanges = () => {
        return firstName !== originalValues.firstName ||
            lastName !== originalValues.lastName
    }

    return (
        <SafeScreen backgroundColor="#09090b">
            <ScrollView style={{ backgroundColor: "#09090b" }} contentContainerStyle={styles.container}>
                {/* Glowing Red Background Orbs */}
                <View style={styles.orbTopRight} />
                <View style={styles.orbBottomLeft} />

                <View style={styles.headerRow}>
                    <Pressable
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                            router.back()
                        }}
                        style={styles.backBtn}
                    >
                        <MaterialCommunityIcons name="arrow-right" size={22} color="#ef4444" />
                        <Text style={styles.backBtnText}>חזרה</Text>
                    </Pressable>
                    <Text style={styles.title}>עריכת פרטים אישיים ✏️</Text>
                </View>

                {!!error && <Text style={styles.error}>{error}</Text>}

                <View style={styles.card}>
                    <View style={styles.field}>
                        <Text style={styles.label}>שם פרטי</Text>
                        <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="ישראל" placeholderTextColor="#71717a" textAlign="right" />
                    </View>
                    <View style={styles.field}>
                        <Text style={styles.label}>שם משפחה</Text>
                        <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="ישראלי" placeholderTextColor="#71717a" textAlign="right" />
                    </View>
                    <View style={styles.field}>
                        <Text style={styles.label}>מספר טלפון (נעול)</Text>
                        <TextInput
                            style={[styles.input, styles.disabledInput]}
                            value={phone}
                            editable={false}
                            textAlign="right"
                        />
                        <Text style={styles.disabledNote}>🔒 מספר הטלפון משמש כמזהה החשבון ולא ניתן לשינוי</Text>
                    </View>

                    <Pressable
                        disabled={loading || !hasUnsavedChanges()}
                        onPress={onSave}
                        style={({ pressed }) => [
                            styles.saveButton,
                            (loading || !hasUnsavedChanges()) && { opacity: 0.5 },
                            pressed && hasUnsavedChanges() && { opacity: 0.85 }
                        ]}
                    >
                        <Text style={styles.saveButtonText}>
                            {hasUnsavedChanges() ? 'שמור שינויים' : 'אין שינויים'}
                        </Text>
                    </Pressable>

                    <Pressable
                        disabled={loading}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                            router.back()
                        }}
                        style={styles.cancelButton}
                    >
                        <Text style={styles.cancelButtonText}>ביטול</Text>
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
        backgroundColor: '#09090b'
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
    headerRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    backBtn: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    backBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#ef4444',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'right',
    },
    error: {
        color: '#ef4444',
        textAlign: 'center',
        fontWeight: '500',
    },
    card: {
        backgroundColor: 'rgba(24, 24, 27, 0.85)',
        borderRadius: 20,
        padding: 20,
        gap: 16,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    field: {
        gap: 6
    },
    label: {
        color: '#a1a1aa',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'right'
    },
    input: {
        backgroundColor: '#27272a',
        borderWidth: 1.5,
        borderColor: 'rgba(239, 68, 68, 0.25)',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        color: '#ffffff',
    },
    disabledInput: {
        backgroundColor: '#18181b',
        borderColor: '#27272a',
        color: '#a1a1aa',
        fontWeight: '600'
    },
    disabledNote: {
        fontSize: 12,
        color: '#71717a',
        textAlign: 'right',
        marginTop: 2
    },
    saveButton: {
        backgroundColor: '#dc2626',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
        elevation: 3,
    },
    saveButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelButton: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderColor: 'rgba(239, 68, 68, 0.3)',
        borderWidth: 1,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#ef4444',
        fontWeight: '600',
        fontSize: 15,
    }
})
