/**
 * OnboardingFlow — 3-slide intro carousel for first-time users.
 */

import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ONBOARDING_KEY = 'onboarding_completed';

interface Slide {
    emoji: string;
    title: string;
    description: string;
    color: string;
}

const SLIDES: Slide[] = [
    {
        emoji: '🚀',
        title: 'Trade Across Exchanges',
        description:
            'Access Hyperliquid, dYdX, GMX, Lighter, and Aster — all from a single, unified interface.',
        color: '#3B82F6',
    },
    {
        emoji: '📊',
        title: 'Track Your Portfolio',
        description:
            'Real-time P&L tracking, position management, and performance analytics across all your exchanges.',
        color: '#22C55E',
    },
    {
        emoji: '🔒',
        title: 'Secure & Self-Custodial',
        description:
            'Connect with Web3Auth for easy access. Your keys, your funds — always under your control.',
        color: '#A78BFA',
    },
];

interface OnboardingFlowProps {
    onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    const handleComplete = useCallback(async () => {
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        onComplete();
    }, [onComplete]);

    const handleNext = useCallback(() => {
        if (activeIndex < SLIDES.length - 1) {
            setActiveIndex(activeIndex + 1);
        } else {
            handleComplete();
        }
    }, [activeIndex, handleComplete]);

    const handleScroll = useCallback((event: any) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        setActiveIndex(index);
    }, []);

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScroll}
                scrollEventThrottle={16}
            >
                {SLIDES.map((slide, index) => (
                    <View key={index} style={styles.slide}>
                        <View style={[styles.emojiContainer, { backgroundColor: `${slide.color}20` }]}>
                            <Text style={styles.emoji}>{slide.emoji}</Text>
                        </View>
                        <Text style={styles.title}>{slide.title}</Text>
                        <Text style={styles.description}>{slide.description}</Text>
                    </View>
                ))}
            </ScrollView>

            {/* Dots indicator */}
            <View style={styles.dotsContainer}>
                {SLIDES.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            index === activeIndex && styles.dotActive,
                            index === activeIndex && { backgroundColor: SLIDES[activeIndex].color },
                        ]}
                    />
                ))}
            </View>

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
                <TouchableOpacity onPress={handleComplete} style={styles.skipButton}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleNext}
                    style={[styles.nextButton, { backgroundColor: SLIDES[activeIndex].color }]}
                    accessibilityRole="button"
                    accessibilityLabel={activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
                >
                    <Text style={styles.nextText}>
                        {activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

/**
 * Check if onboarding has been completed.
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
    try {
        const value = await AsyncStorage.getItem(ONBOARDING_KEY);
        return value === 'true';
    } catch {
        return false;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0E17',
    },
    slide: {
        width: SCREEN_WIDTH,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emojiContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
    },
    emoji: {
        fontSize: 56,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        color: '#9CA3AF',
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 24,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 40,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#334155',
    },
    dotActive: {
        width: 24,
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 48,
    },
    skipButton: {
        paddingVertical: 14,
        paddingHorizontal: 24,
    },
    skipText: {
        color: '#6B7280',
        fontSize: 16,
        fontWeight: '600',
    },
    nextButton: {
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 24,
    },
    nextText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
