import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import React, { useState } from 'react'
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import config from '../../config'
import tokenManager from '../../lib/tokenManager'

const ImageUploader = ({
    currentImage,
    onImageUploaded,
    size = 120,
    showOverlay = true,
    uploadEndpoint = '/users/upload-profile-image',
    placeholderText = 'הוסף תמונת פרופיל',
    requireAuth = true,
    localOnly = false,
    fileFieldName = 'profileImage'
}) => {
    const [uploading, setUploading] = useState(false)
    const [imageError, setImageError] = useState(false)

    const pickImage = async () => {
        try {
            // בודק הרשאות
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('הרשאה נדרשת', 'אנא תן הרשאה לגישה לגלריה כדי לבחור תמונה');
                return;
            }

            // פותח את הגלריה
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                if (localOnly) {
                    // אם זה מקומי בלבד, רק מעביר את ה-URI
                    if (onImageUploaded) {
                        onImageUploaded(result.assets[0].uri);
                    }
                } else {
                    // אחרת מעלה לשרת
                    await uploadImage(result.assets[0].uri);
                }
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('שגיאה', 'לא ניתן לבחור תמונה');
        }
    };

    const uploadImage = async (imageUri) => {
        try {
            setUploading(true);

            // ❌ אל תסיר file://
            const uri = imageUri; // השאר כמו שהוא

            const imageName = imageUri.split("/").pop() || `profile_${Date.now()}.jpg`;

            const formData = new FormData();
            formData.append(fileFieldName, {
                uri,
                name: imageName,
                type: "image/jpeg", // בסדר לרוב; אם יש לך mime אמיתי – עדיף
            });

            const headers = { Accept: "application/json" };
            if (requireAuth) {
                const token = await tokenManager.getToken();
                if (token) headers["Authorization"] = `Bearer ${token}`;
            }

            const response = await fetch(`${config.BASE_URL}${uploadEndpoint}`, {
                method: "POST",
                headers,            // ❗️לא להגדיר Content-Type ידנית
                body: formData,
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data?.error || data?.message || "שגיאה בהעלאת התמונה");

            const newImageUrl = data.profileImage || data.imageUrl || data.url;
            onImageUploaded?.(newImageUrl);
            Alert.alert("הצלחה", "התמונה הועלתה בהצלחה!");
        } catch (error) {
            console.error("Error uploading image:", error);
            Alert.alert("שגיאה", error.message || "שגיאה בהעלאת התמונה");
        } finally {
            setUploading(false);
        }
    };



    const imageUrl = currentImage?.replace('/svg?', '/png?');

    return (
        <Pressable
            style={[styles.container, { width: size, height: size }]}
            onPress={pickImage}
            disabled={uploading}
        >
            {currentImage && !imageError ? (
                <Image
                    source={{ uri: imageUrl }}
                    style={styles.image}
                    onError={() => setImageError(true)}
                    onLoad={() => setImageError(false)}
                />
            ) : (
                <View style={styles.placeholder}>
                    <MaterialCommunityIcons
                        name="camera-plus"
                        size={size * 0.3}
                        color="#d4af37"
                    />
                    <Text style={[styles.placeholderText, { fontSize: size * 0.1 }]}>
                        {placeholderText}
                    </Text>
                </View>
            )}

            {showOverlay && (
                <View style={styles.overlay}>
                    <MaterialCommunityIcons
                        name="camera-plus"
                        size={size * 0.15}
                        color="#ffffff"
                    />
                </View>
            )}

            {uploading && (
                <View style={styles.uploadingOverlay}>
                    <MaterialCommunityIcons
                        name="loading"
                        size={size * 0.2}
                        color="#ffffff"
                    />
                </View>
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 999,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#d4af37',
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        position: 'relative',
        borderStyle: 'dashed',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
    placeholderText: {
        color: '#d4af37',
        textAlign: 'center',
        marginTop: 4,
        fontWeight: '500',
    },
    overlay: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#3b82f6',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#ffffff',
    },
    uploadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default ImageUploader;
