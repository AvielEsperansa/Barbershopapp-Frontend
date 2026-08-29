import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'
import config from '../config'
import apiClient from '../lib/apiClient'
import tokenManager from '../lib/tokenManager'
import SafeScreen from './components/SafeScreen'

const { width } = Dimensions.get('window')
const COLUMN_WIDTH = (width - 48) / 2

export default function ManageGallery() {
    const [galleryItems, setGalleryItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    // Modal state
    const [modalVisible, setModalVisible] = useState(false)
    const [selectedImageUri, setSelectedImageUri] = useState(null)
    const [imageTitle, setImageTitle] = useState('')
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        loadGallery()
    }, [])

    const loadGallery = async () => {
        try {
            setLoading(true)
            const res = await apiClient.get(`${config.BASE_URL}/content/gallery`)
            if (res.ok) {
                const data = await res.json()
                setGalleryItems(data.items || [])
            }
        } catch (e) {
            console.error('Error loading gallery:', e)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const onRefresh = () => {
        setRefreshing(true)
        loadGallery()
    }

    // צילום תמונה במצלמה
    const handleTakePhoto = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync()
            if (status !== 'granted') {
                Alert.alert('הרשאה נדרשת', 'נא לאשר גישה למצלמה לצילום תספורת')
                return
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            })

            if (!result.canceled && result.assets[0]) {
                setSelectedImageUri(result.assets[0].uri)
                setModalVisible(true)
            }
        } catch (e) {
            console.error('Camera error:', e)
            Alert.alert('שגיאה', 'לא ניתן לפתוח את המצלמה')
        }
    }

    // בחירת תמונה מהגלריה
    const handlePickFromLibrary = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
            if (status !== 'granted') {
                Alert.alert('הרשאה נדרשת', 'נא לאשר גישה לגלריית התמונות')
                return
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            })

            if (!result.canceled && result.assets[0]) {
                setSelectedImageUri(result.assets[0].uri)
                setModalVisible(true)
            }
        } catch (e) {
            console.error('Gallery pick error:', e)
            Alert.alert('שגיאה', 'לא ניתן לבחור תמונה')
        }
    }

    const handleUpload = async () => {
        if (!selectedImageUri) {
            Alert.alert('שגיאה', 'נא לבחור תמונה להעלאה')
            return
        }

        setUploading(true)
        try {
            const formData = new FormData()
            const filename = selectedImageUri.split('/').pop() || `gallery_${Date.now()}.jpg`

            formData.append('image', {
                uri: selectedImageUri,
                name: filename,
                type: 'image/jpeg',
            })

            if (imageTitle.trim()) {
                formData.append('title', imageTitle.trim())
            }

            const token = await tokenManager.getToken()
            const headers = {
                Accept: 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            }

            const res = await fetch(`${config.BASE_URL}/content/gallery`, {
                method: 'POST',
                headers,
                body: formData,
            })

            const data = await res.json()
            if (res.ok) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                Alert.alert('הצלחה', 'התמונה נוספה לגלריה בהצלחה!')
                setModalVisible(false)
                setSelectedImageUri(null)
                setImageTitle('')
                loadGallery()
            } else {
                Alert.alert('שגיאה', data.error || 'שגיאה בהעלאת התמונה')
            }
        } catch (e) {
            console.error('Error uploading gallery image:', e)
            Alert.alert('שגיאה', 'אירעה שגיאה בחיבור לשרת')
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = (item) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        Alert.alert(
            'מחיקת תמונה',
            'האם אתה בטוח שברצונך למחוק תמונה זו מהגלריה?',
            [
                { text: 'ביטול', style: 'cancel' },
                {
                    text: 'מחק',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const res = await apiClient.delete(`${config.BASE_URL}/content/gallery/${item._id}`)
                            if (res.ok) {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                                loadGallery()
                            } else {
                                Alert.alert('שגיאה', 'לא ניתן למחוק את התמונה')
                            }
                        } catch (e) {
                            Alert.alert('שגיאה', 'שגיאה במחיקת התמונה')
                        }
                    }
                }
            ]
        )
    }

    const renderGalleryItem = ({ item }) => (
        <View style={styles.gridCard}>
            <Image source={{ uri: item.imageUrl }} style={styles.gridImage} resizeMode="cover" />

            {/* כיתוב על התמונה אם קיים */}
            {!!item.title && (
                <View style={styles.imageOverlay}>
                    <Text style={styles.imageTag} numberOfLines={1}>
                        {item.title}
                    </Text>
                </View>
            )}

            {/* כפתור מחיקה */}
            <TouchableOpacity
                style={styles.trashBtn}
                onPress={() => handleDelete(item)}
                activeOpacity={0.8}
            >
                <MaterialCommunityIcons name="trash-can" size={18} color="#ffffff" />
            </TouchableOpacity>
        </View>
    )

    return (
        <SafeScreen backgroundColor="#0f172a" statusBarStyle="light">
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <MaterialCommunityIcons name="arrow-right" size={24} color="#3b82f6" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>גלריית עבודות וסטייל ✂️</Text>
                </View>

                {/* Upload Action Buttons */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity style={[styles.actionButton, styles.cameraBtn]} onPress={handleTakePhoto}>
                        <MaterialCommunityIcons name="camera" size={20} color="#ffffff" />
                        <Text style={styles.actionButtonText}>צלם במצלמה</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionButton, styles.galleryPickBtn]} onPress={handlePickFromLibrary}>
                        <MaterialCommunityIcons name="image-plus" size={20} color="#ffffff" />
                        <Text style={styles.actionButtonText}>העלה מהגלריה</Text>
                    </TouchableOpacity>
                </View>

                {/* Content */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                        <Text style={styles.loadingText}>טוען גלריה...</Text>
                    </View>
                ) : galleryItems.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="image-multiple-outline" size={64} color="#334155" />
                        <Text style={styles.emptyTitle}>אין תמונות בגלריה</Text>
                        <Text style={styles.emptySubtitle}>צלם או העלה תמונות של תספורות ועבודות שיוצגו ללקוחות בעמוד הבית</Text>
                    </View>
                ) : (
                    <FlatList
                        data={galleryItems}
                        keyExtractor={(item) => item._id}
                        renderItem={renderGalleryItem}
                        numColumns={2}
                        columnWrapperStyle={styles.columnWrapper}
                        contentContainerStyle={styles.gridContent}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
                        }
                    />
                )}

                {/* Upload Details Modal */}
                <Modal
                    visible={modalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>הוספת תמונה לגלריה 📸</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <MaterialCommunityIcons name="close-circle" size={26} color="#64748b" />
                                </TouchableOpacity>
                            </View>

                            {/* תצוגה מקדימה של התמונה שנבחרה */}
                            {selectedImageUri && (
                                <View style={styles.previewImageWrap}>
                                    <Image source={{ uri: selectedImageUri }} style={styles.previewImage} />
                                    {!!imageTitle.trim() && (
                                        <View style={styles.previewTagOverlay}>
                                            <Text style={styles.imageTag}>{imageTitle.trim()}</Text>
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* כיתוב על התמונה (אופציונלי) */}
                            <Text style={styles.inputLabel}>כיתוב על התמונה (אופציונלי)</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="לדוגמה: פייד נמוך, עיצוב זקן, טקסטורה..."
                                placeholderTextColor="#64748b"
                                value={imageTitle}
                                onChangeText={setImageTitle}
                                textAlign="right"
                            />

                            {/* Buttons */}
                            <View style={styles.modalBottomActions}>
                                <TouchableOpacity
                                    style={[styles.modalSubmitBtn, uploading && { opacity: 0.7 }]}
                                    onPress={handleUpload}
                                    disabled={uploading}
                                >
                                    {uploading ? (
                                        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
                                            <ActivityIndicator size="small" color="#ffffff" />
                                            <Text style={styles.modalSubmitText}>מעלה תמונה...</Text>
                                        </View>
                                    ) : (
                                        <Text style={styles.modalSubmitText}>הוסף לגלריה</Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.modalCancelBtn}
                                    onPress={() => setModalVisible(false)}
                                    disabled={uploading}
                                >
                                    <Text style={styles.modalCancelText}>ביטול</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </SafeScreen>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    header: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#1e293b',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(59, 130, 246, 0.12)',
    },
    backBtn: {
        marginLeft: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#f1f5f9',
        flex: 1,
        textAlign: 'right',
    },
    actionsRow: {
        flexDirection: 'row-reverse',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 13,
        borderRadius: 14,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    cameraBtn: {
        backgroundColor: '#3b82f6',
    },
    galleryPickBtn: {
        backgroundColor: '#6366f1',
    },
    actionButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '700',
    },
    gridContent: {
        padding: 16,
        paddingBottom: 40,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    gridCard: {
        width: COLUMN_WIDTH,
        height: COLUMN_WIDTH * 1.25,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#1e293b',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        position: 'relative',
    },
    gridImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        left: 8,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignItems: 'center',
    },
    imageTag: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '700',
    },
    trashBtn: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.85)',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 15,
        color: '#64748b',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        gap: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#94a3b8',
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 20,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalContent: {
        backgroundColor: '#1e293b',
        borderRadius: 20,
        padding: 20,
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
    },
    modalHeader: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 19,
        fontWeight: '700',
        color: '#f1f5f9',
        textAlign: 'right',
    },
    previewImageWrap: {
        width: '100%',
        height: 220,
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 14,
        backgroundColor: '#0f172a',
        position: 'relative',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    previewTagOverlay: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        left: 8,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        alignItems: 'center',
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94a3b8',
        textAlign: 'right',
        marginBottom: 6,
    },
    textInput: {
        backgroundColor: '#0f172a',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#f1f5f9',
        marginBottom: 16,
    },
    modalBottomActions: {
        flexDirection: 'row-reverse',
        gap: 10,
    },
    modalSubmitBtn: {
        flex: 1,
        backgroundColor: '#3b82f6',
        paddingVertical: 13,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalSubmitText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '700',
    },
    modalCancelBtn: {
        paddingVertical: 13,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalCancelText: {
        color: '#94a3b8',
        fontSize: 15,
        fontWeight: '600',
    },
})
