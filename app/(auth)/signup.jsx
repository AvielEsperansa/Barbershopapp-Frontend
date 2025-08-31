import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import config from '../../config';

export default function Signup() {
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const validate = () => {
        if (!email || !password || !firstName || !lastName || !phone) return 'All fields are required'
        if (!email.includes('@')) return 'Invalid email'
        if (password.length < 8) return 'Password must be at least 8 characters long'
        if (phone.length !== 10) return 'Phone number must be 10 digits long'
        if (!phone.startsWith('05')) return 'Phone number must start with 05'
        if (firstName.length < 3 || lastName.length < 3) return 'First and last name must be at least 3 characters long'
        return null
    }

    const onSubmit = async () => {
        const err = validate()
        if (err) {
            Alert.alert('שגיאה', err)
            return
        }
        try {
            setLoading(true)
            const response = await fetch(`${config.BASE_URL}/users/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, email, phone, password })
            })
            const isJson = (response.headers.get('content-type') || '').includes('application/json')
            const data = isJson ? await response.json() : await response.text()
            if (!response.ok) {
                const message = isJson ? (data?.error || data?.message || 'ההרשמה נכשלה') : (data || 'ההרשמה נכשלה')
                throw new Error(message)
            }
            // בדיקה שהבקנד החזיר token
            if (data.accessToken) {
                // שמירת ה-token
                await AsyncStorage.setItem('accessToken', data.accessToken)
                if (data.refreshToken) {
                    await AsyncStorage.setItem('refreshToken', data.refreshToken)
                }

                Alert.alert('הצלחה', 'המשתמש נרשם בהצלחה! מתחבר אוטומטית...', [
                    {
                        text: 'אישור',
                        onPress: () => {
                            router.replace('/(customerTabs)')
                        }
                    }
                ])
            } else {
                // אם אין token, מעביר לדף התחברות
                Alert.alert('הצלחה', 'המשתמש נרשם בהצלחה! אנא התחבר', [
                    {
                        text: 'אישור',
                        onPress: () => router.replace('/(auth)/index')
                    }
                ])
            }
        } catch (e) {
            Alert.alert('שגיאה', e.message || 'ההרשמה נכשלה')
        } finally {
            setLoading(false)
        }
    }

    return (
        <View style={{ flex: 1, padding: 16, gap: 12, justifyContent: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: '600', textAlign: 'center' }}>הרשמה</Text>
            <TextInput placeholder='שם פרטי' value={firstName} onChangeText={setFirstName} style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, textAlign: 'right' }} />
            <TextInput placeholder='שם משפחה' value={lastName} onChangeText={setLastName} style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, textAlign: 'right' }} />
            <TextInput placeholder='אימייל' autoCapitalize='none' keyboardType='email-address' value={email} onChangeText={setEmail} style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, textAlign: 'right' }} />
            <TextInput placeholder='טלפון (05xxxxxxxx)' keyboardType='phone-pad' value={phone} onChangeText={setPhone} style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, textAlign: 'right' }} />
            <TextInput placeholder='סיסמה' secureTextEntry value={password} onChangeText={setPassword} style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, textAlign: 'right' }} />
            {/* Simple role input; replace with picker if needed */}
            <Pressable onPress={onSubmit} disabled={loading} style={{ backgroundColor: '#111', padding: 14, borderRadius: 8, opacity: loading ? 0.7 : 1 }}>
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>{loading ? 'שולח...' : 'צור חשבון'}</Text>
            </Pressable>
        </View>
    )
}