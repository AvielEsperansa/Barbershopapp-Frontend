import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config';

class TokenManager {
    constructor() {
        this.refreshInterval = null;
        this.init();
    }

    async init() {
        // מתחיל את המערכת שמרעננת טוקנים
        this.startAutoRefresh();
    }

    // מתחיל רענון אוטומטי של טוקנים
    startAutoRefresh() {
        console.log('🚀 Starting auto-refresh system...');
        // מרענן טוקן כל 10 דקות (לפני שהוא פג תוקף אחרי 15 דקות)
        this.refreshInterval = setInterval(async () => {
            try {
                console.log('🔄 Auto-refreshing token...');
                await this.refreshTokenIfNeeded();
            } catch (error) {
                console.log('❌ Auto-refresh failed:', error.message || error);
            }
        }, 10 * 60 * 1000); // 10 דקות
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
        try {
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            if (!refreshToken) {
                return false;
            }

            const response = await fetch(`${config.BASE_URL}/users/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });

            if (response.ok) {
                const data = await response.json();
                await AsyncStorage.setItem('accessToken', data.accessToken);
                console.log('✅ Token refreshed automatically');
                return true;
            } else {
                // אם refresh token פג תוקף, נמחק את כל הטוקנים
                await AsyncStorage.removeItem('accessToken');
                await AsyncStorage.removeItem('refreshToken');
                console.log('⚠️ Refresh token expired, user must log in again');
                return false;
            }
        } catch (error) {
            console.error('❌ Error in auto-refresh:', error);
            return false;
        }
    }

    // מנקה את כל הטוקנים (בעת logout)
    async clearTokens() {
        console.log('🚪 Logging out - clearing tokens...');
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        this.stopAutoRefresh();
        console.log('✅ Tokens cleared successfully');
    }

    // בודק אם המשתמש מחובר
    async isLoggedIn() {
        const accessToken = await AsyncStorage.getItem('accessToken');
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        const hasTokens = !!(accessToken && refreshToken);
        console.log(`🔍 Login check: ${hasTokens ? '✅ Has tokens' : '❌ No tokens'}`);
        return hasTokens;
    }

    // מרענן טוקן מיד כשהאפליקציה נפתחת
    async refreshTokenOnAppStart() {
        try {
            console.log('📱 App started - checking login status...');
            const isLoggedIn = await this.isLoggedIn();
            if (isLoggedIn) {
                console.log('✅ User is logged in, refreshing token...');
                // מרענן טוקן מיד כשהאפליקציה נפתחת
                await this.refreshTokenIfNeeded();
                // מתחיל את הרענון האוטומטי
                this.startAutoRefresh();
                return true;
            } else {
                console.log('❌ User is not logged in');
            }
            return false;
        } catch (error) {
            console.error('❌ Error refreshing token on app start:', error);
            return false;
        }
    }

    // מרענן טוקן גם כשהאפליקציה נפתחת מחדש
    async refreshTokenOnAppResume() {
        try {
            console.log('🔄 App resumed - checking token...');
            const isLoggedIn = await this.isLoggedIn();
            if (isLoggedIn) {
                console.log('✅ User is logged in, refreshing token on resume...');
                // מרענן טוקן מיד כשהאפליקציה נפתחת מחדש
                await this.refreshTokenIfNeeded();
                return true;
            } else {
                console.log('❌ User is not logged in on resume');
            }
            return false;
        } catch (error) {
            console.error('❌ Error refreshing token on app resume:', error);
            return false;
        }
    }
}

export default new TokenManager();
