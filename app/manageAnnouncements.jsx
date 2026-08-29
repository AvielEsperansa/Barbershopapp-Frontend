import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'
import config from '../config'
import apiClient from '../lib/apiClient'
import SafeScreen from './components/SafeScreen'

const AVAILABLE_ICONS = [
    { name: 'bullhorn', label: 'עדכון', color: '#d97706', bgColor: '#fef3c7' },
    { name: 'sale', label: 'מבצע', color: '#ef4444', bgColor: '#fee2e2' },
    { name: 'clock-check-outline', label: 'שעות', color: '#2563eb', bgColor: '#dbeafe' },
    { name: 'scissors-cutting', label: 'תספורת', color: '#059669', bgColor: '#d1fae5' },
    { name: 'star', label: 'מיוחד', color: '#8b5cf6', bgColor: '#ede9fe' },
    { name: 'gift', label: 'מתנה', color: '#ec4899', bgColor: '#fce7f3' },
    { name: 'tag', label: 'הטבה', color: '#f59e0b', bgColor: '#fef3c7' },
    { name: 'information', label: 'מידע', color: '#0284c7', bgColor: '#e0f2fe' },
]

export default function ManageAnnouncements() {
    const [announcements, setAnnouncements] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    // Modal State
    const [modalVisible, setModalVisible] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [saving, setSaving] = useState(false)

    // Form fields
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [selectedIcon, setSelectedIcon] = useState(AVAILABLE_ICONS[0])
    const [isNewItem, setIsNewItem] = useState(true)

    useEffect(() => {
        loadAnnouncements()
    }, [])

    const loadAnnouncements = async () => {
        try {
            setLoading(true)
            const res = await apiClient.get(`${config.BASE_URL}/content/announcements`)
            if (res.ok) {
                const data = await res.json()
                setAnnouncements(data.announcements || [])
            }
        } catch (e) {
            console.error('Error loading announcements:', e)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const onRefresh = () => {
        setRefreshing(true)
        loadAnnouncements()
    }

    const openAddModal = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        setEditingId(null)
        setTitle('')
        setContent('')
        setSelectedIcon(AVAILABLE_ICONS[0])
        setIsNewItem(true)
        setModalVisible(true)
    }

    const openEditModal = (item) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        setEditingId(item._id)
        setTitle(item.title || '')
        setContent(item.content || '')
        const foundIcon = AVAILABLE_ICONS.find(i => i.name === item.icon) || {
            name: item.icon || 'bullhorn',
            label: 'אייקון',
            color: item.color || '#d97706',
            bgColor: item.bgColor || '#fef3c7'
        }
        setSelectedIcon(foundIcon)
        setIsNewItem(item.isNewItem !== undefined ? item.isNewItem : true)
        setModalVisible(true)
    }

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('שגיאה', 'נא להזין כותרת להודעה')
            return
        }
        if (!content.trim()) {
            Alert.alert('שגיאה', 'נא להזין את תוכן ההודעה')
            return
        }

        setSaving(true)
        try {
            const payload = {
                title: title.trim(),
                content: content.trim(),
                icon: selectedIcon.name,
                color: selectedIcon.color,
                bgColor: selectedIcon.bgColor,
                isNewItem,
            }

            let res
            if (editingId) {
                res = await apiClient.put(`${config.BASE_URL}/content/announcements/${editingId}`, payload)
            } else {
                res = await apiClient.post(`${config.BASE_URL}/content/announcements`, payload)
            }

            if (res.ok) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                Alert.alert('הצלחה', editingId ? 'ההודעה עודכנה בהצלחה' : 'ההודעה נוספה בהצלחה')
                setModalVisible(false)
                loadAnnouncements()
            } else {
                const data = await res.json()
                Alert.alert('שגיאה', data.error || 'שגיאה בשמירת ההודעה')
            }
        } catch (e) {
            console.error('Error saving announcement:', e)
            Alert.alert('שגיאה', 'אירעה שגיאה בחיבור לשרת')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = (item) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        Alert.alert(
            'מחיקת הודעה',
            `האם אתה בטוח שברצונך למחוק את ההודעה "${item.title}"?`,
            [
                { text: 'ביטול', style: 'cancel' },
                {
                    text: 'מחק',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const res = await apiClient.delete(`${config.BASE_URL}/content/announcements/${item._id}`)
                            if (res.ok) {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                                loadAnnouncements()
                            } else {
                                Alert.alert('שגיאה', 'לא ניתן למחוק את ההודעה')
                            }
                        } catch (e) {
                            Alert.alert('שגיאה', 'שגיאה במחיקת ההודעה')
                        }
                    }
                }
            ]
        )
    }

    const renderAnnouncementItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={[styles.iconWrap, { backgroundColor: item.bgColor || '#fef3c7' }]}>
                    <MaterialCommunityIcons
                        name={item.icon || 'bullhorn'}
                        size={22}
                        color={item.color || '#d97706'}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        {item.isNewItem && (
                            <View style={styles.newBadge}>
                                <Text style={styles.newBadgeText}>חדש</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.cardDate}>
                        {new Date(item.createdAt).toLocaleDateString('he-IL')} • {new Date(item.createdAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>

            <Text style={styles.cardContent}>{item.content}</Text>

            <View style={styles.cardActions}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDelete(item)}
                >
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
                    <Text style={styles.deleteBtnText}>מחק</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, styles.editBtn]}
                    onPress={() => openEditModal(item)}
                >
                    <MaterialCommunityIcons name="pencil-outline" size={18} color="#3b82f6" />
                    <Text style={styles.editBtnText}>ערוך</Text>
                </TouchableOpacity>
            </View>
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
                    <Text style={styles.headerTitle}>ניהול הודעות ועדכונים 📢</Text>
                </View>

                {/* Add Button */}
                <TouchableOpacity style={styles.addMainBtn} onPress={openAddModal}>
                    <MaterialCommunityIcons name="plus-circle" size={22} color="#ffffff" />
                    <Text style={styles.addMainBtnText}>הוסף הודעה חדשה</Text>
                </TouchableOpacity>

                {/* List */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                        <Text style={styles.loadingText}>טוען הודעות...</Text>
                    </View>
                ) : announcements.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="bullhorn-outline" size={64} color="#334155" />
                        <Text style={styles.emptyTitle}>אין הודעות פעילות</Text>
                        <Text style={styles.emptySubtitle}>לחץ על הכפתור למעלה כדי לפרסם הודעה ראשונה ללקוחות</Text>
                    </View>
                ) : (
                    <FlatList
                        data={announcements}
                        keyExtractor={(item) => item._id}
                        renderItem={renderAnnouncementItem}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
                        }
                    />
                )}

                {/* Add / Edit Modal */}
                <Modal
                    visible={modalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>
                                    {editingId ? 'עריכת הודעה ✏️' : 'הודעה חדשה 📢'}
                                </Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <MaterialCommunityIcons name="close-circle" size={26} color="#64748b" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                                {/* כותרת */}
                                <Text style={styles.inputLabel}>כותרת ההודעה *</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="לדוגמה: מבצע סוף שבוע לוהט! 🔥"
                                    placeholderTextColor="#64748b"
                                    value={title}
                                    onChangeText={setTitle}
                                    textAlign="right"
                                />

                                {/* תוכן */}
                                <Text style={styles.inputLabel}>תוכן ההודעה *</Text>
                                <TextInput
                                    style={[styles.textInput, styles.textArea]}
                                    placeholder="כתוב כאן את פרטי ההודעה או המבצע..."
                                    placeholderTextColor="#64748b"
                                    value={content}
                                    onChangeText={setContent}
                                    multiline
                                    numberOfLines={4}
                                    textAlign="right"
                                    textAlignVertical="top"
                                />

                                {/* בחירת אייקון */}
                                <Text style={styles.inputLabel}>בחר לוגו / אייקון (אופציונלי)</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconsRow}>
                                    {AVAILABLE_ICONS.map((iconItem) => {
                                        const isSelected = selectedIcon.name === iconItem.name
                                        return (
                                            <TouchableOpacity
                                                key={iconItem.name}
                                                style={[
                                                    styles.iconPickCard,
                                                    isSelected && { borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.15)' }
                                                ]}
                                                onPress={() => setSelectedIcon(iconItem)}
                                            >
                                                <View style={[styles.iconWrapMini, { backgroundColor: iconItem.bgColor }]}>
                                                    <MaterialCommunityIcons name={iconItem.name} size={22} color={iconItem.color} />
                                                </View>
                                                <Text style={[styles.iconPickLabel, isSelected && { color: '#3b82f6', fontWeight: 'bold' }]}>
                                                    {iconItem.label}
                                                </Text>
                                            </TouchableOpacity>
                                        )
                                    })}
                                </ScrollView>

                                {/* תגית חדש */}
                                <View style={styles.switchRow}>
                                    <Switch
                                        value={isNewItem}
                                        onValueChange={setIsNewItem}
                                        trackColor={{ false: '#334155', true: '#3b82f6' }}
                                        thumbColor="#ffffff"
                                    />
                                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                        <Text style={styles.switchTitle}>הצג תגית "חדש" 🔴</Text>
                                        <Text style={styles.switchSubtitle}>יוסיף נקודת הבהוב ותגית להדגשת ההודעה</Text>
                                    </View>
                                </View>

                                {/* Live Preview */}
                                <Text style={[styles.inputLabel, { marginTop: 16 }]}>תצוגה מקדימה (כך זה ייראה ללקוח):</Text>
                                <View style={styles.previewCard}>
                                    <View style={[styles.iconWrap, { backgroundColor: selectedIcon.bgColor }]}>
                                        <MaterialCommunityIcons name={selectedIcon.name} size={22} color={selectedIcon.color} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <View style={styles.titleRow}>
                                            <Text style={styles.previewTitle}>{title.trim() || 'כותרת ההודעה'}</Text>
                                            {isNewItem && (
                                                <View style={styles.newBadge}>
                                                    <Text style={styles.newBadgeText}>חדש</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.previewContent}>
                                            {content.trim() || 'תוכן ההודעה יוצג כאן בצורה מעוצבת...'}
                                        </Text>
                                    </View>
                                </View>
                            </ScrollView>

                            {/* Buttons */}
                            <View style={styles.modalBottomActions}>
                                <TouchableOpacity
                                    style={[styles.modalSubmitBtn, saving && { opacity: 0.7 }]}
                                    onPress={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <ActivityIndicator size="small" color="#ffffff" />
                                    ) : (
                                        <Text style={styles.modalSubmitText}>{editingId ? 'שמור שינויים' : 'פרסם הודעה'}</Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.modalCancelBtn}
                                    onPress={() => setModalVisible(false)}
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
    addMainBtn: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3b82f6',
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
        paddingVertical: 14,
        borderRadius: 14,
        gap: 8,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    addMainBtnText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
        gap: 12,
    },
    card: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
        gap: 10,
    },
    cardHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 12,
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#f1f5f9',
        flex: 1,
        textAlign: 'right',
    },
    newBadge: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    newBadgeText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '700',
    },
    cardDate: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'right',
        marginTop: 2,
    },
    cardContent: {
        fontSize: 14,
        color: '#cbd5e1',
        lineHeight: 20,
        textAlign: 'right',
    },
    cardActions: {
        flexDirection: 'row-reverse',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 6,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.04)',
        paddingTop: 10,
    },
    actionBtn: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    editBtn: {
        backgroundColor: 'rgba(59, 130, 246, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.25)',
    },
    editBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#3b82f6',
    },
    deleteBtn: {
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)',
    },
    deleteBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#ef4444',
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
        maxHeight: '90%',
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
    modalScroll: {
        maxHeight: 460,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94a3b8',
        textAlign: 'right',
        marginBottom: 6,
        marginTop: 10,
    },
    textInput: {
        backgroundColor: '#0f172a',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 15,
        color: '#f1f5f9',
    },
    textArea: {
        height: 90,
        paddingTop: 10,
    },
    iconsRow: {
        flexDirection: 'row-reverse',
        gap: 8,
        paddingVertical: 4,
    },
    iconPickCard: {
        alignItems: 'center',
        backgroundColor: '#0f172a',
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        minWidth: 64,
        gap: 4,
    },
    iconWrapMini: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconPickLabel: {
        fontSize: 11,
        color: '#94a3b8',
    },
    switchRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#0f172a',
        padding: 12,
        borderRadius: 12,
        marginTop: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    switchTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#f1f5f9',
        textAlign: 'right',
    },
    switchSubtitle: {
        fontSize: 11,
        color: '#64748b',
        textAlign: 'right',
        marginTop: 2,
    },
    previewCard: {
        flexDirection: 'row-reverse',
        alignItems: 'flex-start',
        backgroundColor: '#0f172a',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.3)',
        gap: 12,
    },
    previewTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#f1f5f9',
        textAlign: 'right',
    },
    previewContent: {
        fontSize: 13,
        color: '#94a3b8',
        lineHeight: 18,
        textAlign: 'right',
        marginTop: 4,
    },
    modalBottomActions: {
        flexDirection: 'row-reverse',
        gap: 10,
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.08)',
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
