import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import config from '../config';

class ApiClient {
    constructor() {
        this.isRefreshing = false;
        this.failedQueue = [];
    }

    // פונקציה שמציגה הודעה למשתמש ומעבירה להתחברות
    showAuthErrorAndRedirect() {
        Alert.alert(
            'התחברות פגה',
            'ההתחברות שלך פגה. אנא התחבר שוב.',
            [
                {
                    text: 'אישור',
                    onPress: () => router.replace('/(auth)')
                }
            ]
        );
    }
    // מטפל בתור של בקשות שנכשלו בזמן רענון הטוקן
    processQueue(error, token = null) {
        this.failedQueue.forEach(({ resolve, reject }) => {
            if (error) {
                reject(error);
            } else {
                resolve(token);
            }
        });
        this.failedQueue = [];
    }

    // מחדש את הטוקן
    async refreshToken() {
        try {
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            if (!refreshToken) {
                throw new Error('No refresh token');
            }

            const response = await fetch(`${config.BASE_URL}/users/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });

            const data = await response.json();

            if (response.ok) {
                await AsyncStorage.setItem('accessToken', data.accessToken);
                return data.accessToken;
            } else {
                // אם refresh token פג תוקף, נמחק את כל הטוקנים ונעביר לדף התחברות
                await AsyncStorage.removeItem('accessToken');
                await AsyncStorage.removeItem('refreshToken');
                this.showAuthErrorAndRedirect();
                throw new Error('Refresh token expired');
            }
        } catch (error) {
            throw error;
        }
    }

    // פונקציה שמבצעת בקשה עם טיפול אוטומטי בטוקן
    async request(url, options = {}) {
        try {
            // מוסיף את הטוקן הנוכחי
            const accessToken = await AsyncStorage.getItem('accessToken');
            if (accessToken) {
                options.headers = {
                    ...options.headers,
                    Authorization: `Bearer ${accessToken}`,
                };
            }

            // מבצע את הבקשה
            let response = await fetch(url, options);

            // אם הטוקן פג תוקף, מנסה לרענן אותו
            if (response.status === 401 && !this.isRefreshing) {
                this.isRefreshing = true;

                try {
                    const newToken = await this.refreshToken();
                    this.processQueue(null, newToken);

                    // מבצע את הבקשה שוב עם הטוקן החדש
                    options.headers = {
                        ...options.headers,
                        Authorization: `Bearer ${newToken}`,
                    };
                    response = await fetch(url, options);
                } catch (error) {
                    this.processQueue(error, null);
                    // אם לא הצלחנו לרענן את הטוקן, נעביר לדף התחברות
                    if (error.message === 'Refresh token expired') {
                        this.showAuthErrorAndRedirect();
                    }
                    throw error;
                } finally {
                    this.isRefreshing = false;
                }
            } else if (response.status === 401 && this.isRefreshing) {
                // אם כבר מרעננים טוקן, ממתין לתוצאה
                return new Promise((resolve, reject) => {
                    this.failedQueue.push({ resolve, reject });
                }).then(token => {
                    options.headers = {
                        ...options.headers,
                        Authorization: `Bearer ${token}`,
                    };
                    return fetch(url, options);
                });
            } else if (response.status === 401) {
                // אם הטוקן פג תוקף ולא הצלחנו לרענן אותו, נעביר לדף התחברות
                this.showAuthErrorAndRedirect();
            }

            return response;
        } catch (error) {
            // אם יש שגיאה אחרת, נבדוק אם זה קשור לטוקן
            if (error.message === 'Refresh token expired') {
                this.showAuthErrorAndRedirect();
            }
            throw error;
        }
    }

    // פונקציות עזר לבקשות נפוצות
    async get(url, options = {}) {
        return this.request(url, { ...options, method: 'GET' });
    }

    async post(url, body, options = {}) {
        return this.request(url, {
            ...options,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            body: JSON.stringify(body),
        });
    }

    async put(url, body, options = {}) {
        return this.request(url, {
            ...options,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            body: JSON.stringify(body),
        });
    }

    async delete(url, options = {}) {
        return this.request(url, { ...options, method: 'DELETE' });
    }
}

export default new ApiClient();
