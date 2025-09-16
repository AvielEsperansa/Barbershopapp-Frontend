import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import tokenManager from '../lib/tokenManager';
import SafeScreen from './components/SafeScreen';

const { width } = Dimensions.get('window');

export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('🔍 Starting auth check...');

        // בודק אם המשתמש מחובר (כולל בדיקת תקפות הטוקן) עם timeout
        const authPromise = tokenManager.isLoggedInSilent();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth check timeout')), 5000) // 5 שניות timeout
        );

        const loggedIn = await Promise.race([authPromise, timeoutPromise]);
        console.log('🔍 Auth check result:', loggedIn);

        setIsLoggedIn(loggedIn);

        if (loggedIn) {
          // אם המשתמש מחובר, בודק את התפקיד שלו
          const role = await AsyncStorage.getItem('role');
          console.log('🔍 User role:', role);

          // מעביר אותו לטאב המתאים
          if (role === 'barber') {
            console.log('🚀 Redirecting to barber dashboard...');
            router.replace('/(barberTabs)/Dashboard');
          } else {
            console.log('🚀 Redirecting to customer tabs...');
            router.replace('/(customerTabs)');
          }
        } else {
          console.log('❌ User not logged in, staying on landing page');
          // לא מעביר לדף התחברות - נותן למשתמש לבחור
        }
      } catch (error) {
        console.error('❌ Error checking auth status:', error.message);
        // אם זה timeout, זה לא באג - זה התנהגות תקינה
        if (error.message === 'Auth check timeout') {
          console.log('⏰ Auth check timed out - user needs to log in');
        }
        setIsLoggedIn(false);
        // לא מעביר לדף התחברות - נותן למשתמש לבחור
      }
    };

    checkAuthStatus();
  }, []);

  // אם המשתמש מחובר, לא מציג את עמוד הנחיתה
  if (isLoggedIn) {
    return null;
  }

  return (
    <SafeScreen backgroundColor="#1a1a1a">
      <View style={styles.container}>

        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Oshri</Text>
            <Text style={styles.logoSubtext}>Barber</Text>
          </View>
          <Text style={styles.tagline}>המספרה המקצועית שלכם</Text>
        </View>

        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>ברוכים הבאים</Text>
            <Text style={styles.heroSubtitle}>
              לקבלת השירות הטוב ביותר במספרה מקצועית
            </Text>
            <Text style={styles.heroDescription}>
              צוות מקצועי, ציוד מתקדם ושירות ברמה הגבוהה ביותר
            </Text>
          </View>

          {/* Decorative Elements */}
          <View style={styles.decorativeElements}>
            <View style={[styles.circle, styles.circle1]} />
            <View style={[styles.circle, styles.circle2]} />
            <View style={[styles.circle, styles.circle3]} />
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.features}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>✂️</Text>
            </View>
            <Text style={styles.featureText}>גזירה מקצועית</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>💈</Text>
            </View>
            <Text style={styles.featureText}>תספורת מודרנית</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>⭐</Text>
            </View>
            <Text style={styles.featureText}>שירות מעולה</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.replace('/(auth)/')}
          >
            <Text style={styles.primaryButtonText}>התחברו</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.replace('/(auth)/signup')}
          >
            <Text style={styles.secondaryButtonText}>הירשמו</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2024 Oshri Barber. כל הזכויות שמורות</Text>
        </View>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingTop: 10,
    paddingHorizontal: 24,
    paddingBottom: 15,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#d4af37',
    letterSpacing: 2,
  },
  logoSubtext: {
    fontSize: 18,
    fontWeight: '300',
    color: '#ffffff',
    letterSpacing: 4,
    marginTop: -8,
  },
  tagline: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    fontWeight: '300',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    position: 'relative',
  },
  heroContent: {
    alignItems: 'center',
    zIndex: 2,
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontSize: 20,
    color: '#d4af37',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  heroDescription: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: width * 0.8,
  },
  decorativeElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  circle1: {
    width: 200,
    height: 200,
    top: 50,
    right: -50,
  },
  circle2: {
    width: 150,
    height: 150,
    bottom: 100,
    left: -30,
  },
  circle3: {
    width: 100,
    height: 100,
    top: 200,
    left: 50,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingVertical: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureText: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '500',
  },
  actions: {
    paddingHorizontal: 24,
    paddingVertical: 30,
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#d4af37',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#d4af37',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#d4af37',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#d4af37',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
  },
});
