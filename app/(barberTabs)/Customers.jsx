import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Linking,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'
import config from '../../config'
import apiClient from '../../lib/apiClient'
import SafeScreen from '../components/SafeScreen'

export default function Customers() {
    const [customers, setCustomers] = useState([])
    const [filteredCustomers, setFilteredCustomers] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [filterStatus, setFilterStatus] = useState('all') // all, active, inactive

    useEffect(() => {
        loadCustomers()
    }, [])

    useEffect(() => {
        filterCustomers()
    }, [customers, searchText, filterStatus, filterCustomers])

    const loadCustomers = async () => {
        try {
            setLoading(true)
            const response = await apiClient.get(`${config.BASE_URL}/appointments/barber/customers?type=all`)
            if (response.ok) {
                const data = await response.json()
                setCustomers(data.customers || [])
                console.log('Customers loaded:', data)
            } else {
                Alert.alert('שגיאה', 'לא ניתן לטעון את רשימת הלקוחות')
            }
        } catch (error) {
            console.error('Error loading customers:', error)
            Alert.alert('שגיאה', 'אירעה שגיאה בטעינת הלקוחות')
        } finally {
            setLoading(false)
        }
    }

    const onRefresh = async () => {
        setRefreshing(true)
        await loadCustomers()
        setRefreshing(false)
    }

    const filterCustomers = React.useCallback(() => {
        let filtered = customers

        // פילטר לפי סטטוס (כרגע כל הלקוחות פעילים)
        if (filterStatus !== 'all') {
            filtered = filtered.filter(appointment => {
                if (filterStatus === 'active') {
                    return true // כל הלקוחות פעילים כרגע
                } else if (filterStatus === 'inactive') {
                    return false // אין לקוחות לא פעילים כרגע
                }
                return true
            })
        }

        // פילטר לפי חיפוש טקסט
        if (searchText.trim()) {
            filtered = filtered.filter(appointment => {
                const customer = appointment.customer
                const customerName = `${customer.firstName} ${customer.lastName}`
                return customerName?.toLowerCase().includes(searchText.toLowerCase()) ||
                    customer.phone?.includes(searchText)
            })
        }

        setFilteredCustomers(filtered)
    }, [customers, searchText, filterStatus])

    const openWhatsApp = (phoneNumber) => {
        let cleanPhone = phoneNumber.replace(/[^0-9]/g, '')

        // הוסף קידומת ישראל אם לא קיימת
        if (cleanPhone.startsWith('0')) {
            cleanPhone = '972' + cleanPhone.substring(1)
        } else if (!cleanPhone.startsWith('972')) {
            cleanPhone = '972' + cleanPhone
        }

        // נסה מספר אפשרויות לפתיחת WhatsApp
        const whatsappUrls = [
            `whatsapp://send?phone=${cleanPhone}`,
            `https://wa.me/${cleanPhone}`,
            `https://api.whatsapp.com/send?phone=${cleanPhone}`
        ]

        const tryOpenWhatsApp = async (urls, index = 0) => {
            if (index >= urls.length) {
                Alert.alert('שגיאה', 'לא ניתן לפתוח את WhatsApp. אנא התקין את האפליקציה או נסה לשלוח הודעה ידנית.')
                return
            }

            try {
                const canOpen = await Linking.canOpenURL(urls[index])
                if (canOpen) {
                    await Linking.openURL(urls[index])
                } else {
                    // נסה את האפשרות הבאה
                    tryOpenWhatsApp(urls, index + 1)
                }
            } catch (error) {
                console.error('Error opening WhatsApp:', error)
                // נסה את האפשרות הבאה
                tryOpenWhatsApp(urls, index + 1)
            }
        }

        tryOpenWhatsApp(whatsappUrls)
    }

    const viewCustomerHistory = (customerData) => {
        const customer = customerData.customer
        router.push({
            pathname: '/customerHaircuts',
            params: {
                customerId: customer._id,
                customerName: `${customer.firstName} ${customer.lastName}`,
                customerPhone: customer.phone,
                appointmentsData: JSON.stringify(customerData.appointments || [])
            }
        })
    }

    const renderCustomerItem = ({ item: customerData }) => {
        const customer = customerData.customer
        const customerName = `${customer.firstName} ${customer.lastName}`
        const appointmentsCount = customerData.appointments?.length || 0

        return (
            <TouchableOpacity
                style={styles.customerCard}
                onPress={() => viewCustomerHistory(customerData)}
                activeOpacity={0.7}
            >
                <View style={styles.customerInfo}>
                    <View style={styles.customerHeader}>
                        <View style={styles.avatarWrap}>
                            <MaterialCommunityIcons name="account" size={22} color="#3b82f6" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.customerName}>{customerName}</Text>
                            <View style={styles.customerMeta}>
                                <MaterialCommunityIcons name="phone" size={13} color="#64748b" />
                                <Text style={styles.metaText}>{customer.phone}</Text>
                                <View style={styles.metaDivider} />
                                <MaterialCommunityIcons name="calendar" size={13} color="#64748b" />
                                <Text style={styles.metaText}>{appointmentsCount} תורים</Text>
                            </View>
                        </View>
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>פעיל</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => viewCustomerHistory(customerData)}
                    >
                        <MaterialCommunityIcons name="history" size={18} color="#3b82f6" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, { borderColor: 'rgba(37, 211, 102, 0.2)' }]}
                        onPress={() => openWhatsApp(customer.phone)}
                    >
                        <MaterialCommunityIcons name="whatsapp" size={18} color="#25d366" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        )
    }

    if (loading) {
        return (
            <SafeScreen backgroundColor="#0f172a" statusBarStyle="light">
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={styles.loadingText}>טוען לקוחות...</Text>
                </View>
            </SafeScreen>
        )
    }

    return (
        <SafeScreen backgroundColor="#0f172a" statusBarStyle="light">
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <MaterialCommunityIcons name="arrow-right" size={24} color="#3b82f6" />
                    </TouchableOpacity>
                    <Text style={styles.title}>ניהול לקוחות</Text>
                </View>

                <View style={styles.searchContainer}>
                    <MaterialCommunityIcons name="magnify" size={20} color="#64748b" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="חפש לקוח לפי שם, טלפון או אימייל..."
                        placeholderTextColor="#475569"
                        value={searchText}
                        onChangeText={setSearchText}
                        textAlign="right"
                    />
                </View>

                {/* כפתורי פילטר */}
                <View style={styles.filterContainer}>
                    <TouchableOpacity
                        style={[styles.filterButton, filterStatus === 'all' && styles.activeFilterButton]}
                        onPress={() => setFilterStatus('all')}
                    >
                        <Text style={[styles.filterButtonText, filterStatus === 'all' && styles.activeFilterButtonText]}>
                            הכל
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.filterButton, filterStatus === 'active' && styles.activeFilterButton]}
                        onPress={() => setFilterStatus('active')}
                    >
                        <Text style={[styles.filterButtonText, filterStatus === 'active' && styles.activeFilterButtonText]}>
                            פעילים
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.filterButton, filterStatus === 'inactive' && styles.activeFilterButton]}
                        onPress={() => setFilterStatus('inactive')}
                    >
                        <Text style={[styles.filterButtonText, filterStatus === 'inactive' && styles.activeFilterButtonText]}>
                            לא פעילים
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{filteredCustomers.length}</Text>
                        <Text style={styles.statLabel}>
                            {filterStatus === 'all' ? 'סה"כ לקוחות' :
                                filterStatus === 'active' ? 'לקוחות פעילים' : 'לקוחות לא פעילים'}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>
                            {filteredCustomers.reduce((sum, customerData) => sum + (customerData.appointments?.length || 0), 0)}
                        </Text>
                        <Text style={styles.statLabel}>תורים בסך הכל</Text>
                    </View>
                </View>

                <FlatList
                    data={filteredCustomers}
                    renderItem={renderCustomerItem}
                    keyExtractor={(item) => item.customer._id.toString()}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
                    }
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="account-multiple-outline" size={64} color="#334155" />
                            <Text style={styles.emptyText}>
                                {searchText ? 'לא נמצאו לקוחות המתאימים לחיפוש' : 'אין לקוחות רשומים'}
                            </Text>
                        </View>
                    }
                />
            </View>
        </SafeScreen>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0f172a'
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#64748b'
    },
    header: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#1e293b',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(59, 130, 246, 0.12)'
    },
    backButton: {
        marginLeft: 12
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#f1f5f9',
        flex: 1,
        textAlign: 'right'
    },
    searchContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        marginHorizontal: 16,
        marginTop: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
        gap: 12
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#e2e8f0'
    },
    filterContainer: {
        flexDirection: 'row-reverse',
        paddingHorizontal: 16,
        marginTop: 12,
        gap: 8
    },
    filterButton: {
        flex: 1,
        paddingVertical: 9,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: '#1e293b',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
        alignItems: 'center'
    },
    activeFilterButton: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6'
    },
    filterButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b'
    },
    activeFilterButtonText: {
        color: '#ffffff',
        fontWeight: '700'
    },
    statsContainer: {
        flexDirection: 'row-reverse',
        paddingHorizontal: 16,
        marginTop: 16,
        gap: 10
    },
    statItem: {
        flex: 1,
        backgroundColor: '#1e293b',
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.12)'
    },
    statNumber: {
        fontSize: 26,
        fontWeight: '800',
        color: '#3b82f6'
    },
    statLabel: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 4,
        textAlign: 'center'
    },
    listContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 100
    },
    customerCard: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
        flexDirection: 'row-reverse',
        alignItems: 'center',
    },
    customerInfo: {
        flex: 1
    },
    customerHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 12,
    },
    avatarWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    customerName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#f1f5f9',
        textAlign: 'right'
    },
    customerMeta: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 5,
        marginTop: 4,
    },
    metaText: {
        fontSize: 12,
        color: '#64748b',
    },
    metaDivider: {
        width: 3,
        height: 3,
        borderRadius: 2,
        backgroundColor: '#475569',
        marginHorizontal: 4,
    },
    statusBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    statusText: {
        fontSize: 11,
        color: '#10b981',
        fontWeight: '600'
    },
    customerDetails: {
        gap: 4
    },
    detailRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8
    },
    detailText: {
        fontSize: 13,
        color: '#94a3b8',
        flex: 1,
        textAlign: 'right'
    },
    actionButtons: {
        flexDirection: 'column',
        gap: 8,
        marginRight: 8
    },
    actionButton: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 64
    },
    emptyText: {
        fontSize: 15,
        color: '#64748b',
        marginTop: 16,
        textAlign: 'center'
    }
})
