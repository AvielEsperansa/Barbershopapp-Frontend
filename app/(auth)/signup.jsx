import { router } from 'expo-router'
import React, { useState } from 'react'
import { Alert, Pressable, Text, TextInput, View } from 'react-native'
const API_URL = process.env.EXPO_PUBLIC_EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_URL || ''

export default function Signup() {
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('customer')
    const [loading, setLoading] = useState(false)

    const validate = () => {
        if (!email || !password || !firstName || !lastName || !phone) return 'All fields are required'
        if (!email.includes('@')) return 'Invalid email'
        if (password.length < 8) return 'Password must be at least 8 characters long'
        if (phone.length !== 10) return 'Phone number must be 10 digits long'
        if (!phone.startsWith('05')) return 'Phone number must start with 05'
        if (firstName.length < 3 || lastName.length < 3) return 'First and last name must be at least 3 characters long'
        if (!['customer', 'barber', 'admin'].includes(role)) return 'Invalid role'
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
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, firstName, lastName, phone, role })
            })
            const isJson = (response.headers.get('content-type') || '').includes('application/json')
            const data = isJson ? await response.json() : await response.text()
            if (!response.ok) {
                const message = isJson ? (data?.error || data?.message || 'Registration failed') : (data || 'Registration failed')
                throw new Error(message)
            }
            Alert.alert('Success', 'User registered successfully')
            // Persist tokens from data.accessToken/data.refreshToken here if desired
            router.replace('/login')
        } catch (e) {
            Alert.alert('Error', e.message || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <View style={{ flex: 1, padding: 16, gap: 12, justifyContent: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: '600', textAlign: 'center' }}>Signup</Text>
            <TextInput placeholder='First Name' value={firstName} onChangeText={setFirstName} style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8 }} />
            <TextInput placeholder='Last Name' value={lastName} onChangeText={setLastName} style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8 }} />
            <TextInput placeholder='Email' autoCapitalize='none' keyboardType='email-address' value={email} onChangeText={setEmail} style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8 }} />
            <TextInput placeholder='Phone (05xxxxxxxx)' keyboardType='phone-pad' value={phone} onChangeText={setPhone} style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8 }} />
            <TextInput placeholder='Password' secureTextEntry value={password} onChangeText={setPassword} style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8 }} />
            {/* Simple role input; replace with picker if needed */}
            <TextInput placeholder='Role (customer|barber|admin)' autoCapitalize='none' value={role} onChangeText={setRole} style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8 }} />
            <Pressable onPress={onSubmit} disabled={loading} style={{ backgroundColor: '#111', padding: 14, borderRadius: 8, opacity: loading ? 0.7 : 1 }}>
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>{loading ? 'Submitting...' : 'Create Account'}</Text>
            </Pressable>
        </View>
    )
}