/**
 * Type-safe navigation param lists for Root Stack and Bottom Tab navigators.
 */

import type { ExchangeType } from '../components/trading/types';

// ---------------------------------------------------------------------------
// Bottom Tab navigator
// ---------------------------------------------------------------------------

export type TabParamList = {
    Home: undefined;
    Markets: undefined;
    Trade: { market?: string; exchanges?: ExchangeType[] } | undefined;
    Earn: undefined;
    Wallet: undefined;
};

// ---------------------------------------------------------------------------
// Root Stack navigator (wraps tabs + modal screens)
// ---------------------------------------------------------------------------

export type RootStackParamList = {
    /** The main tab navigator */
    Tabs: undefined;
    /** Modal: Connect exchange sources */
    ConnectSources: undefined;
    /** Modal: Active positions list */
    ActivePositions: undefined;
    /** Modal: Trading form */
    TradingForm: { market?: string; markPrice?: number };
    /** Modal: Order history */
    OrderHistory: undefined;
};
