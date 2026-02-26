import * as SecureStore from 'expo-secure-store';
import { saveActiveIndicators, loadActiveIndicators, clearActiveIndicators } from '../indicatorStorage';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
    setItemAsync: jest.fn(),
    getItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));

const mockedSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe('indicatorStorage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('saveActiveIndicators', () => {
        it('saves indicator array as JSON string', async () => {
            await saveActiveIndicators(['MA', 'RSI']);
            expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith(
                'user_active_indicators',
                JSON.stringify(['MA', 'RSI']),
            );
        });

        it('handles empty array', async () => {
            await saveActiveIndicators([]);
            expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith(
                'user_active_indicators',
                JSON.stringify([]),
            );
        });

        it('does not throw on storage failure', async () => {
            mockedSecureStore.setItemAsync.mockRejectedValueOnce(new Error('Storage full'));
            await expect(saveActiveIndicators(['VOL'])).resolves.not.toThrow();
        });
    });

    describe('loadActiveIndicators', () => {
        it('returns parsed indicators when stored', async () => {
            mockedSecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify(['MACD', 'KDJ']));
            const result = await loadActiveIndicators();
            expect(result).toEqual(['MACD', 'KDJ']);
        });

        it('returns null when nothing is stored', async () => {
            mockedSecureStore.getItemAsync.mockResolvedValueOnce(null);
            const result = await loadActiveIndicators();
            expect(result).toBeNull();
        });

        it('returns null on parse error', async () => {
            mockedSecureStore.getItemAsync.mockResolvedValueOnce('invalid-json');
            const result = await loadActiveIndicators();
            expect(result).toBeNull();
        });

        it('returns null on storage failure', async () => {
            mockedSecureStore.getItemAsync.mockRejectedValueOnce(new Error('Read error'));
            const result = await loadActiveIndicators();
            expect(result).toBeNull();
        });
    });

    describe('clearActiveIndicators', () => {
        it('deletes the storage key', async () => {
            await clearActiveIndicators();
            expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith('user_active_indicators');
        });

        it('does not throw on delete failure', async () => {
            mockedSecureStore.deleteItemAsync.mockRejectedValueOnce(new Error('Delete error'));
            await expect(clearActiveIndicators()).resolves.not.toThrow();
        });
    });
});
