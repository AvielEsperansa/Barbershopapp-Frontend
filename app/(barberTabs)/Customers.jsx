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
                    customer.phone?.includes(searchText) ||
                    customer.email?.toLowerCase().includes(searchText.toLowerCase())
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
            >
                <View style={styles.customerInfo}>
                    <View style={styles.customerHeader}>
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>
                                פעיל
                            </Text>
                        </View>
                        <Text style={styles.customerName}>{customerName}</Text>
                    </View>

                    <View style={styles.customerDetails}>
                        <View style={styles.detailRow}>
                            <MaterialCommunityIcons name="phone" size={16} color="#6b7280" />
                            <Text style={styles.detailText}>{customer.phone}</Text>
                        </View>

                        {customer.email && (
                            <View style={styles.detailRow}>
                                <MaterialCommunityIcons name="email" size={16} color="#6b7280" />
                                <Text style={styles.detailText}>{customer.email}</Text>
                            </View>
                        )}

                        <View style={styles.detailRow}>
                            <MaterialCommunityIcons name="calendar" size={16} color="#6b7280" />
                            <Text style={styles.detailText}>
                                {appointmentsCount} תורים
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => viewCustomerHistory(customerData)}
                    >
                        <MaterialCommunityIcons name="history" size={20} color="#3b82f6" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => openWhatsApp(customer.phone)}
                    >
                        <MaterialCommunityIcons name="whatsapp" size={20} color="#25d366" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        )
    }

    if (loading) {
        return (
            <SafeScreen backgroundColor="#f8fafc">
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={styles.loadingText}>טוען לקוחות...</Text>
                </View>
            </SafeScreen>
        )
    }

    return (
        <SafeScreen backgroundColor="#f8fafc">
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
                    <MaterialCommunityIcons name="magnify" size={20} color="#6b7280" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="חפש לקוח לפי שם, טלפון או אימייל..."
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
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="account-multiple-outline" size={64} color="#d1d5db" />
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
        backgroundColor: '#f8fafc'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc'
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6b7280'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb'
    },
    backButton: {
        marginRight: 12
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        flex: 1,
        textAlign: 'right'
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        marginTop: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        gap: 12
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#111827'
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginTop: 12,
        gap: 8
    },
    filterButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        alignItems: 'center'
    },
    activeFilterButton: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6'
    },
    filterButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280'
    },
    activeFilterButtonText: {
        color: '#ffffff',
        fontWeight: '600'
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginTop: 16,
        gap: 12
    },
    statItem: {
        flex: 1,
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#3b82f6'
    },
    statLabel: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
        textAlign: 'center'
    },
    listContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 100
    },
    customerCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    customerInfo: {
        flex: 1
    },
    customerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    customerName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        flex: 1,
        textAlign: 'right'
    },
    statusBadge: {
        backgroundColor: '#10b981',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginRight: 8
    },
    statusText: {
        fontSize: 12,
        color: '#ffffff',
        fontWeight: '500'
    },
    customerDetails: {
        gap: 4
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    detailText: {
        fontSize: 14,
        color: '#6b7280',
        flex: 1,
        textAlign: 'right'
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
        marginLeft: 8
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 64
    },
    emptyText: {
        fontSize: 16,
        color: '#6b7280',
        marginTop: 16,
        textAlign: 'center'
    }
})
