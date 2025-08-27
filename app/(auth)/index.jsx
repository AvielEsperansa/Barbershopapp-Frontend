import { router } from 'expo-router'
import React, { useState } from 'react'
import { Alert, Pressable, Text, TextInput, View } from 'react-native'
const API_URL = process.env.EXPO_PUBLIC_EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_URL || ''

export default function Index() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const validate = () => {
        if (!email || !password) return 'All fields are required'
        if (!email.includes('@')) return 'Invalid email'
        return null
    }

    const onSubmit = async () => {
        const err = validate()
        if (err) {
            Alert.alert('Validation', err)
            return
        }
        try {
            setLoading(true)
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })
            const isJson = (response.headers.get('content-type') || '').includes('application/json')
            const data = isJson ? await response.json() : await response.text()
            if (!response.ok) {
                const message = isJson ? (data?.error || data?.message || 'Login failed') : (data || 'Login failed')
                throw new Error(message)
            }
            Alert.alert('Success', 'Login successful')
            // Persist tokens from data.accessToken/data.refreshToken here
            router.replace('/')
        } catch (e) {
            Alert.alert('Error', e.message || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <View style={{ flex: 1, padding: 16, gap: 12, justifyContent: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: '600', textAlign: 'center' }}>Login</Text>
            <TextInput placeholder='Email' autoCapitalize='none' keyboardType='email-address' value={email} onChangeText={setEmail} style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8 }} />
            <TextInput placeholder='Password' secureTextEntry value={password} onChangeText={setPassword} style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8 }} />
            <Pressable onPress={onSubmit} disabled={loading} style={{ backgroundColor: '#111', padding: 14, borderRadius: 8, opacity: loading ? 0.7 : 1 }}>
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>{loading ? 'Signing in...' : 'Sign In'}</Text>
            </Pressable>
        </View>
    )
}


