import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import config from '../config';

class TokenManager {
    constructor() {
        this.refreshInterval = null;
        this.isLoggingOut = false; // דגל למניעת כפילות בהתנתקות
        this.init();
    }

    async init() {
        // מתחיל את המערכת שמרעננת טוקנים
        this.startAutoRefresh();
    }

    // מתחיל רענון אוטומטי של טוקנים
    startAutoRefresh() {
        console.log('🚀 Starting auto-refresh system...');
        this.isLoggingOut = false; // מאפס את דגל ההתנתקות
        // מרענן טוקן כל 10 דקות (לפני שהוא פג תוקף אחרי 15 דקות)
        this.refreshInterval = setInterval(async () => {
            // אם המשתמש בהתנתקות, לא נבדוק טוקנים
            if (this.isLoggingOut) {
                console.log('🚪 User is logging out, skipping auto-refresh');
                return;
            }

            try {
                console.log('🔄 Auto-refreshing token...');
                const success = await this.refreshTokenIfNeeded();
                if (!success) {
                    // אם לא הצלחנו לרענן, נבדוק אם יש טוקנים בכלל
                    const hasTokens = await this.checkTokensExist();
                    if (!hasTokens && !this.isLoggingOut) {
                        this.redirectToLogin();
                    }
                }
            } catch (error) {
                console.log('❌ Auto-refresh failed:', error.message || error);
                // נבדוק אם יש טוקנים בכלל
                const hasTokens = await this.checkTokensExist();
                if (!hasTokens && !this.isLoggingOut) {
                    this.redirectToLogin();
                }
            }
        }, 10 * 60 * 1000); // 10 דקות
    }

    // בודק אם יש טוקנים בכלל (בלי לנסות לרענן)
    async checkTokensExist() {
        try {
            const accessToken = await AsyncStorage.getItem('accessToken');
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            return !!(accessToken && refreshToken);
        } catch (error) {
            console.log('❌ Error checking tokens exist:', error.message);
            return false;
        }
    }

    // עוצר את הרענון האוטומטי
    stopAutoRefresh() {
        if (this.refreshInterval) {
            console.log('⏹️ Stopping auto-refresh system...');
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    // בודק אם צריך לרענן טוקן ומרענן אם כן
    async refreshTokenIfNeeded() {
        const maxRetries = 2; // פחות ניסיונות
        const timeout = 5000; // timeout קצר יותר (5 שניות)

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 Starting token refresh check (attempt ${attempt}/${maxRetries})...`);
                const refreshToken = await AsyncStorage.getItem('refreshToken');
                if (!refreshToken) {
                    console.log('❌ No refresh token found');
                    return false;
                }

                console.log('🌐 Making refresh request to:', `${config.BASE_URL}/users/refresh`);

                // יצירת AbortController לשליטה ב-timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                const response = await fetch(`${config.BASE_URL}/users/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                console.log('📡 Refresh response status:', response.status);

                if (response.ok) {
                    const data = await response.json();
                    await AsyncStorage.setItem('accessToken', data.accessToken);
                    console.log('✅ Token refreshed successfully');
                    return true;
                } else {
                    console.log('❌ Refresh failed with status:', response.status);
                    // אם refresh token פג תוקף, נמחק את כל הטוקנים
                    await AsyncStorage.removeItem('accessToken');
                    await AsyncStorage.removeItem('refreshToken');
                    console.log('⚠️ Refresh token expired, user must log in again');
                    return false;
                }
            } catch (error) {
                // לא נדפיס שגיאות AbortError כי זה התנהגות תקינה של timeout
                if (error.name === 'AbortError') {
                    console.log(`⏰ Request timed out (attempt ${attempt}/${maxRetries})`);
                } else {
                    console.error(`❌ Error in auto-refresh (attempt ${attempt}):`, error.message);
                    console.error('❌ Error details:', {
                        message: error.message,
                        name: error.name,
                        stack: error.stack
                    });
                }

                // אם זה הניסיון האחרון, נחזיר false
                if (attempt === maxRetries) {
                    console.log('❌ All retry attempts failed');
                    return false;
                }

                // נחכה פחות זמן לפני הניסיון הבא
                await new Promise(resolve => setTimeout(resolve, 500 * attempt));
            }
        }
        // אם הגענו לכאן, זה אומר שכל הניסיונות נכשלו
        return false;
    }

    // מנקה את כל הטוקנים (בעת logout)
    async clearTokens() {
        console.log('🚪 Logging out - clearing tokens...');
        this.isLoggingOut = true; // מגדיר דגל התנתקות
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        this.stopAutoRefresh();
        console.log('✅ Tokens cleared successfully');
        // לא מנווט כאן - זה יעשה בקומפוננט
    }

    // פונקציה שמנווטת לדף התחברות עם הודעה
    redirectToLogin(message = 'ההתחברות שלך פגה. אנא התחבר שוב.', skipLandingPage = false) {
        // אם skipLandingPage = true, לא מנווט בדף הנחיתה
        if (skipLandingPage) {
            console.log('📍 Skipping redirect on landing page')
            return
        }

        Alert.alert(
            'התחברות',
            message,
            [
                {
                    text: 'אישור',
                    onPress: () => router.replace('/(auth)')
                }
            ]
        );
    }

    // בודק אם המשתמש מחובר (בודק גם תקפות הטוקן) - בלי לנווט
    async isLoggedInSilent() {
        try {
            const accessToken = await AsyncStorage.getItem('accessToken');
            const refreshToken = await AsyncStorage.getItem('refreshToken');

            if (!accessToken || !refreshToken) {
                console.log('🔍 Silent login check: ❌ No tokens found');
                return false;
            }

            // בודק אם הטוקן תקף (לא פג תוקף)
            try {
                const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
                const currentTime = Math.floor(Date.now() / 1000);

                if (tokenPayload.exp && tokenPayload.exp < currentTime) {
                    console.log('🔍 Silent login check: ❌ Token expired, attempting refresh...');
                    // מנסה לרענן את הטוקן עם timeout קצר
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 שניות בלבד

                    try {
                        const refreshed = await Promise.race([
                            this.refreshTokenIfNeeded(),
                            new Promise((_, reject) =>
                                setTimeout(() => reject(new Error('Timeout')), 3000)
                            )
                        ]);
                        clearTimeout(timeoutId);

                        if (!refreshed) {
                            console.log('🔍 Silent login check: ❌ Token refresh failed or timed out');
                            return false;
                        }
                    } catch (error) {
                        clearTimeout(timeoutId);
                        // לא נדפיס שגיאות timeout כי זה התנהגות תקינה
                        if (error.message !== 'Timeout') {
                            console.log('🔍 Silent login check: ❌ Token refresh error:', error.message);
                        } else {
                            console.log('🔍 Silent login check: ❌ Token refresh timed out');
                        }
                        return false;
                    }
                }

                console.log('🔍 Silent login check: ✅ Valid tokens found');
                return true;
            } catch (error) {
                console.log('🔍 Silent login check: ❌ Invalid token format', error.message);
                return false;
            }
        } catch (error) {
            console.log('🔍 Silent login check: ❌ Error checking tokens', error.message);
            return false;
        }
    }

    // בודק אם המשתמש מחובר (בודק גם תקפות הטוקן)
    async isLoggedIn() {
        try {
            const accessToken = await AsyncStorage.getItem('accessToken');
            const refreshToken = await AsyncStorage.getItem('refreshToken');

            if (!accessToken || !refreshToken) {
                console.log('🔍 Login check: ❌ No tokens found');
                return false;
            }

            // בודק אם הטוקן תקף (לא פג תוקף)
            try {
                const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
                const currentTime = Math.floor(Date.now() / 1000);

                if (tokenPayload.exp && tokenPayload.exp < currentTime) {
                    console.log('🔍 Login check: ❌ Token expired, attempting refresh...');
                    // מנסה לרענן את הטוקן עם timeout קצר
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 שניות בלבד

                    try {
                        const refreshed = await Promise.race([
                            this.refreshTokenIfNeeded(),
                            new Promise((_, reject) =>
                                setTimeout(() => reject(new Error('Timeout')), 3000)
                            )
                        ]);
                        clearTimeout(timeoutId);

                        if (!refreshed) {
                            console.log('🔍 Login check: ❌ Token refresh failed or timed out');
                            return false;
                        }
                    } catch (error) {
                        clearTimeout(timeoutId);
                        // לא נדפיס שגיאות timeout כי זה התנהגות תקינה
                        if (error.message !== 'Timeout') {
                            console.log('🔍 Login check: ❌ Token refresh error:', error.message);
                        } else {
                            console.log('🔍 Login check: ❌ Token refresh timed out');
                        }
                        return false;
                    }
                }

                console.log('🔍 Login check: ✅ Valid tokens found');
                return true;
            } catch (error) {
                console.log('🔍 Login check: ❌ Invalid token format', error.message);
                return false;
            }
        } catch (error) {
            console.log('🔍 Login check: ❌ Error checking tokens', error.message);
            return false;
        }
    }

    // מרענן טוקן מיד כשהאפליקציה נפתחת (ברקע - בלי להפריע למשתמש)
    async refreshTokenOnAppStart() {
        try {
            console.log('📱 App started - checking login status...');
            const isLoggedIn = await this.isLoggedIn();
            if (isLoggedIn) {
                console.log('✅ User is logged in, refreshing token...');
                // מרענן טוקן ברקע בלי להפריע למשתמש
                this.refreshTokenIfNeeded().catch(error => {
                    console.log('App start refresh failed:', error.message);
                });
                // מתחיל את הרענון האוטומטי
                this.startAutoRefresh();
                return true;
            } else {
                console.log('❌ User is not logged in');
                return false;
            }
        } catch (error) {
            console.error('❌ Error refreshing token on app start:', error.message);
            return false;
        }
    }

    // מקבל את ה-access token הנוכחי
    async getToken() {
        try {
            const accessToken = await AsyncStorage.getItem('accessToken');
            return accessToken;
        } catch (error) {
            console.log('❌ Error getting token:', error.message);
            return null;
        }
    }

    // מרענן טוקן גם כשהאפליקציה נפתחת מחדש (ברקע - בלי להפריע למשתמש)
    async refreshTokenOnAppResume() {
        try {
            console.log('🔄 App resumed - checking token in background...');
            const isLoggedIn = await this.isLoggedIn();
            if (isLoggedIn) {
                console.log('✅ User is logged in, refreshing token in background...');
                // מרענן טוקן ברקע בלי להפריע למשתמש
                // לא מחכים לתוצאה כדי לא להפריע למשתמש
                this.refreshTokenIfNeeded().catch(error => {
                    console.log('Background refresh failed:', error.message);
                });
                return true;
            } else {
                console.log('❌ User is not logged in on resume');
                return false;
            }
        } catch (error) {
            console.error('❌ Error refreshing token on app resume:', error.message);
            return false;
        }
    }
}

export default new TokenManager();
