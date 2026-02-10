# Manual Test Plan for Indicator Persistence Feature

This document outlines how to manually test the indicator toggle persistence feature
for the KLineChartWebView component.

## Feature Overview

The indicator toggle feature allows users to:
1. Toggle technical indicators (MA, EMA, BOLL, RSI, MACD, VOL, KDJ) on/off
2. See indicators reflected on the chart in real-time
3. Have their selections persisted across app restarts

## Components Modified

1. **utils/indicatorStorage.ts** (NEW)
   - Provides storage utilities using expo-secure-store
   - Functions: saveActiveIndicators, loadActiveIndicators, clearActiveIndicators

2. **components/TradingInterface.tsx** (MODIFIED)
   - Added useEffect to load saved indicators on mount
   - Added useEffect to save indicators whenever they change
   - Imports indicator storage utilities

## Existing Components (No changes needed)

1. **components/trading/IndicatorToggleList.tsx**
   - Already displays horizontal scrollable list of indicator pills
   - Shows active state with blue highlight
   - Positioned above the chart

2. **components/KLineChartWebView.tsx**
   - Already accepts activeIndicators prop
   - Syncs indicators to the chart via window.syncIndicators
   - Handles main pane (MA, EMA, BOLL) and sub-pane (RSI, MACD, VOL, KDJ) indicators

3. **components/trading/types.ts**
   - Defines all 7 indicator types
   - DEFAULT_ACTIVE_INDICATORS = ['VOL']

## Manual Testing Steps

### Test 1: Basic Toggle Functionality
1. Launch the app
2. Navigate to the "Trade" tab
3. Locate the indicator toggle list above the chart (horizontal scrollable pills)
4. Tap on different indicators (MA, EMA, BOLL, RSI, MACD, VOL, KDJ)
5. ✓ Verify pills highlight in blue when active
6. ✓ Verify chart updates to show/hide indicators in real-time

### Test 2: Persistence Across App Restarts
1. Toggle several indicators ON (e.g., MA, RSI, MACD)
2. Note which indicators are active
3. Close the app completely (force quit)
4. Reopen the app
5. Navigate to the "Trade" tab
6. ✓ Verify the same indicators are active as before closing the app
7. ✓ Verify the chart shows these indicators

### Test 3: Persistence Across Navigation
1. Set specific indicators active (e.g., EMA, BOLL, VOL)
2. Navigate to another tab (Home, Earn, or Wallet)
3. Return to the Trade tab
4. ✓ Verify indicators remain active

### Test 4: Default State
1. Clear app data/storage
2. Launch the app fresh
3. Navigate to the Trade tab
4. ✓ Verify VOL indicator is active by default (DEFAULT_ACTIVE_INDICATORS)

### Test 5: Multiple Indicators
1. Enable all main pane indicators (MA, EMA, BOLL)
2. ✓ Verify they overlay on the candle chart
3. Enable all sub-pane indicators (RSI, MACD, VOL, KDJ)
4. ✓ Verify each gets its own separate pane below the main chart
5. Toggle them off one by one
6. ✓ Verify sub-panes are removed when indicators are disabled

## Expected Behavior

- **UI**: Indicator pills appear in a horizontal scrollable list above the chart
- **Visual Feedback**: Active pills have blue background (#0F2847) and blue text/border (#3B82F6)
- **Chart Updates**: Indicators appear/disappear on the chart immediately when toggled
- **Persistence**: Selections persist across app restarts via SecureStore
- **Performance**: No lag when toggling indicators

## Accessibility Considerations

- Pills use TouchableOpacity with activeOpacity={0.7} for press feedback
- Visual states clearly differentiate active/inactive indicators
- Horizontal ScrollView allows access to all indicators on smaller screens

## Known Limitations

- SecureStore may not be available on all platforms (web fallback needed in production)
- If SecureStore fails, selections won't persist but feature still works per session

## Future Enhancements

- Add indicator customization (e.g., MA period settings)
- Add preset combinations (e.g., "Trend Following", "Volatility")
- Add tooltips explaining each indicator
