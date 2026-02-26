/**
 * Biometric authentication utility.
 *
 * Uses `expo-local-authentication` to check hardware availability and
 * prompt Face ID / Fingerprint authentication.
 */

import * as LocalAuthentication from 'expo-local-authentication';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BiometricType = 'face' | 'fingerprint' | 'iris' | 'none';

export interface BiometricCapability {
    /** Whether the device has biometric hardware */
    isAvailable: boolean;
    /** Whether biometrics are enrolled (user has set up Face ID / Fingerprint) */
    isEnrolled: boolean;
    /** Available biometric type */
    type: BiometricType;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check biometric hardware and enrollment status.
 */
export async function checkBiometricCapability(): Promise<BiometricCapability> {
    try {
        const isAvailable = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

        let type: BiometricType = 'none';
        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            type = 'face';
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            type = 'fingerprint';
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
            type = 'iris';
        }

        return { isAvailable, isEnrolled, type };
    } catch {
        return { isAvailable: false, isEnrolled: false, type: 'none' };
    }
}

/**
 * Prompt the user for biometric authentication.
 *
 * @param promptMessage - Message shown in the biometric prompt
 * @returns true if authentication succeeded, false otherwise
 */
export async function authenticateWithBiometrics(
    promptMessage = 'Authenticate to continue',
): Promise<boolean> {
    try {
        const capability = await checkBiometricCapability();

        if (!capability.isAvailable || !capability.isEnrolled) {
            return false;
        }

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage,
            cancelLabel: 'Cancel',
            disableDeviceFallback: false, // Allow PIN fallback
        });

        return result.success;
    } catch {
        return false;
    }
}
