import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SafeScreen({ children, paddingTop = 25, backgroundColor }) {
    const insets = useSafeAreaInsets();
    return (
        <View style={[
            styles.container,
            {
                paddingTop: (insets.top - 25) + paddingTop,
                paddingLeft: insets.left,
                paddingRight: insets.right,
                backgroundColor: backgroundColor
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