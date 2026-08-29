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
        <SafeScreen backgroundColor="#f8fafc">
            <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 30 }]}>
                {/* Header Nav */}
                <View style={styles.headerRow}>
                    <Pressable
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                            router.back()
                        }}
                        style={styles.backBtn}
                    >
                        <MaterialCommunityIcons name="arrow-right" size={22} color="#0f172a" />
                        <Text style={styles.backBtnText}>חזרה</Text>
                    </Pressable>
                    <Text style={styles.title}>עריכת פרטים אישיים ✏️</Text>
                </View>

                {!!error && <Text style={styles.error}>{error}</Text>}

                <View style={styles.card}>
                    <View style={styles.field}>
                        <Text style={styles.label}>שם פרטי</Text>
                        <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="ישראל" textAlign="right" />
                    </View>
                    <View style={styles.field}>
                        <Text style={styles.label}>שם משפחה</Text>
                        <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="ישראלי" textAlign="right" />
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
        backgroundColor: '#f8fafc'
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
        backgroundColor: '#e2e8f0',
    },
    backBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0f172a',
        textAlign: 'right',
    },
    error: {
        color: '#dc2626',
        textAlign: 'center',
        fontWeight: '500',
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        gap: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    field: {
        gap: 6
    },
    label: {
        color: '#475569',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'right'
    },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1.5,
        borderColor: '#cbd5e1',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        color: '#0f172a',
    },
    disabledInput: {
        backgroundColor: '#f1f5f9',
        borderColor: '#e2e8f0',
        color: '#64748b',
        fontWeight: '600'
    },
    disabledNote: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'right',
        marginTop: 2
    },
    saveButton: {
        backgroundColor: '#0f172a',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    saveButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelButton: {
        backgroundColor: '#f1f5f9',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#0f172a',
        fontWeight: '600',
        fontSize: 15,
    }
})
