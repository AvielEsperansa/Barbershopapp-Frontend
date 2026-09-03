import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SafeScreen({ children, paddingTop, paddingBottom, backgroundColor = '#09090b', statusBarStyle = 'light' }) {
    const insets = useSafeAreaInsets();
    
    // Ensure top and bottom insets are handled seamlessly without leaving empty gaps or overlapping
    const topInsetPadding = paddingTop !== undefined ? paddingTop : Math.max(insets.top, 12);
    const bottomInsetPadding = paddingBottom !== undefined ? paddingBottom : Math.max(insets.bottom, 0);

    return (
        <View style={[
            styles.container,
            {
                paddingTop: topInsetPadding,
                paddingBottom: bottomInsetPadding,
                paddingLeft: insets.left,
                paddingRight: insets.right,
                backgroundColor: backgroundColor
            }
        ]}>
            <StatusBar style={statusBarStyle} translucent backgroundColor="transparent" />
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
});