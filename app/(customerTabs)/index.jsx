import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import React from 'react'
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

export default function CustomerDashboard() {

    const tabBarHeight = useBottomTabBarHeight()
    const gallery = [
        // Local haircut photos
        { id: '1', src: require('../../assets/gallery/cut1.jpeg') },
        { id: '2', src: require('../../assets/gallery/cut2.jpeg') },
        { id: '3', src: require('../../assets/gallery/cut3.jpeg') },
    ]

    const openInstagram = async () => {
        const url = 'https://www.instagram.com/oshri_barber'
        try { await Linking.openURL(url) } catch { }
    }

    const openWhatsApp = async () => {
        // Opens WhatsApp chat; replace phone with real number in international format
        const phone = '972526525185'
        const msg = encodeURIComponent('היי, אשמח לקבוע תור ✂️')
        const url = `https://wa.me/${phone}?text=${msg}`
        try { await Linking.openURL(url) } catch { }
    }

    return (
        <ScrollView contentContainerStyle={[styles.container, { paddingBottom: tabBarHeight + 24 }]}>
            <View style={styles.hero}>
                <Text style={styles.title}>Oshri Barber</Text>
                <Text style={styles.subtitle}>Precision • Style • Fresh Cuts</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>קצת על הספר</Text>
                <Text style={styles.about}>
                    אושרי הוא ספר עם תשוקה לדיוק ולסטייל, עם ניסיון רב בגזרות קלאסיות ומודרניות.
                    כל לקוח מקבל יחס אישי ותוצאה מדויקת שמתאימה לקו האישי שלו.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>תספורות אחרונות</Text>
                <View style={styles.grid}>
                    {gallery.map((item) => (
                        <Image key={item.id} source={item.src} style={styles.gridItem} />
                    ))}
                </View>
            </View>

            <View style={[styles.section, styles.ctaSection]}>
                <Pressable onPress={openInstagram} style={styles.ctaButton}>
                    <MaterialCommunityIcons name="instagram" size={20} color="#fff" />
                    <Text style={styles.ctaText}>Instagram</Text>
                </Pressable>
                <Pressable onPress={openWhatsApp} style={[styles.ctaButton, styles.whatsapp]}>
                    <MaterialCommunityIcons name="whatsapp" size={20} color="#fff" />
                    <Text style={styles.ctaText}>WhatsApp</Text>
                </Pressable>
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        gap: 16,
        backgroundColor: '#f8fafc'
    },
    hero: {
        backgroundColor: '#111827',
        borderRadius: 16,
        paddingVertical: 24,
        paddingHorizontal: 16,
        alignItems: 'center',
        gap: 6
    },
    title: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '800'
    },
    subtitle: {
        color: '#9ca3af'
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 16,
        gap: 12
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'right'
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    gridItem: {
        width: '48%',
        aspectRatio: 1,
        borderRadius: 12,
        backgroundColor: '#f3f4f6'
    },
    about: {
        color: '#374151',
        lineHeight: 20,
        textAlign: 'right'
    },
    ctaSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    ctaButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#111827',
        paddingVertical: 12,
        borderRadius: 12
    },
    whatsapp: {
        backgroundColor: '#22c55e',
        marginLeft: 12
    },
    ctaText: {
        color: '#fff',
        fontWeight: '700'
    }
})