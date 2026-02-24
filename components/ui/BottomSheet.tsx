import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    Dimensions,
    TouchableWithoutFeedback,
} from 'react-native';
import { X } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../theme';

interface BottomSheetProps {
    isVisible: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    height?: number; // Optional height, defaults to 50%
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function BottomSheet({
    isVisible,
    onClose,
    title,
    children,
    height,
}: BottomSheetProps) {
    const [showModal, setShowModal] = useState(isVisible);
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Actual height to use
    const sheetHeight = height || SCREEN_HEIGHT * 0.5;

    useEffect(() => {
        if (isVisible) {
            setShowModal(true);
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: sheetHeight, // Slide down by the sheet's height
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setShowModal(false);
            });
        }
    }, [isVisible, sheetHeight]);

    if (!showModal) {
        return null;
    }

    return (
        <Modal
            transparent
            visible={showModal}
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
                </TouchableWithoutFeedback>

                <Animated.View
                    style={[
                        styles.sheet,
                        {
                            height: sheetHeight,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    <View style={styles.handleContainer}>
                        <View style={styles.handle} />
                    </View>

                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>{children}</View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.backdrop,
    },
    sheet: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        overflow: 'hidden',
    },
    handleContainer: {
        alignItems: 'center',
        paddingTop: spacing.sm,
        paddingBottom: spacing.xs,
        width: '100%',
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: colors.handle,
        borderRadius: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.semibold,
        color: colors.text,
    },
    closeButton: {
        padding: 4,
    },
    content: {
        flex: 1,
    },
});
