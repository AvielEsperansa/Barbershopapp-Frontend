import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SafeScreen({ children, paddingTop = 0 }) {
    const insets = useSafeAreaInsets();
    return (
        <View style={[
            styles.container,
            {
                paddingTop: Math.max(insets.top - 25, paddingTop), // מקטין את הרווח ב-15 פיקסלים
                paddingLeft: insets.left,
                paddingRight: insets.right,
                backgroundColor: 'white'
            }
        ]}>
            {children}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
});