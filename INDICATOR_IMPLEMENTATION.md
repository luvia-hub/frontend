# Indicator Toggle Feature Implementation

## Overview

This document describes the implementation of the indicator toggle feature for advanced charting in the luvia-hub/frontend application. The feature enables users to customize their trading chart experience with technical indicators similar to professional platforms like Binance and OKX.

## Feature Capabilities

✅ **Quick Toggles**: Seven technical indicators available (MA, EMA, BOLL, RSI, MACD, VOL, KDJ)  
✅ **Visual List**: Horizontal scrollable pill-style toggles above the chart  
✅ **Real-time Updates**: Chart updates immediately when indicators are toggled  
✅ **Persistence**: User selections saved and restored across app restarts  
✅ **Professional UX**: Blue highlight for active indicators, smooth interactions

## Architecture

### Component Hierarchy

```
TradingInterface (components/TradingInterface.tsx)
  └─ TimeIntervalBar (components/trading/TimeIntervalBar.tsx)
      ├─ IndicatorToggleList (components/trading/IndicatorToggleList.tsx)
      └─ KLineChartWebView (components/KLineChartWebView.tsx)
```

### Data Flow

```
User Tap → IndicatorToggleList → handleToggleIndicator → setActiveIndicators
                                                               ↓
                                                         useEffect (save)
                                                               ↓
                                                    indicatorStorage.ts
                                                               ↓
                                                         SecureStore
                                                               
activeIndicators → KLineChartWebView → WebView → window.syncIndicators → Chart
```

### Storage Flow

```
App Mount → useEffect (load) → indicatorStorage.ts → SecureStore → setActiveIndicators
                                                                           ↓
                                                                    Chart Renders
```

## Implementation Details

### 1. Storage Utility (`utils/indicatorStorage.ts`)

**Purpose**: Persist indicator selections using React Native's SecureStore

**Functions**:
- `saveActiveIndicators(indicators: IndicatorType[]): Promise<void>`
  - Serializes array to JSON and stores in SecureStore
  - Fails gracefully with console warning if storage unavailable
  
- `loadActiveIndicators(): Promise<IndicatorType[] | null>`
  - Retrieves and deserializes stored indicators
  - Returns null if nothing stored or on error
  
- `clearActiveIndicators(): Promise<void>`
  - Removes stored indicators (for testing/reset)

**Storage Key**: `'user_active_indicators'`

**Technology**: expo-secure-store (already in dependencies)

### 2. TradingInterface Updates (`components/TradingInterface.tsx`)

**State Management**:
```typescript
const [activeIndicators, setActiveIndicators] = useState<IndicatorType[]>(DEFAULT_ACTIVE_INDICATORS);
```

**Load on Mount**:
```typescript
useEffect(() => {
  loadActiveIndicators().then((saved) => {
    if (saved !== null) {
      setActiveIndicators(saved);
    }
  });
}, []);
```

**Save on Change** (with initial render skip):
```typescript
const isInitialMount = React.useRef(true);
useEffect(() => {
  if (isInitialMount.current) {
    isInitialMount.current = false;
    return;
  }
  saveActiveIndicators(activeIndicators);
}, [activeIndicators]);
```

**Toggle Handler**:
```typescript
const handleToggleIndicator = useCallback((indicator: IndicatorType) => {
  setActiveIndicators((prev) =>
    prev.includes(indicator)
      ? prev.filter((i) => i !== indicator)
      : [...prev, indicator]
  );
}, []);
```

### 3. Existing Components (No Changes Required)

#### IndicatorToggleList (`components/trading/IndicatorToggleList.tsx`)
- Displays horizontal scrollable list of indicator pills
- Shows Activity icon indicator
- Highlights active pills with blue color scheme
- Calls `onToggleIndicator` callback on press

#### KLineChartWebView (`components/KLineChartWebView.tsx`)
- Receives `activeIndicators` prop
- Syncs to chart via `window.syncIndicators()` JavaScript injection
- Handles main-pane indicators (MA, EMA, BOLL) - overlay on candles
- Handles sub-pane indicators (RSI, MACD, VOL, KDJ) - separate panes

#### Types (`components/trading/types.ts`)
- Defines `IndicatorType` union type
- Exports `AVAILABLE_INDICATORS` configuration array
- Sets `DEFAULT_ACTIVE_INDICATORS = ['VOL']`

## Indicator Types

### Main Pane Indicators (Overlay on Candles)
- **MA** - Moving Average
- **EMA** - Exponential Moving Average  
- **BOLL** - Bollinger Bands

### Sub Pane Indicators (Separate Charts Below)
- **RSI** - Relative Strength Index
- **MACD** - Moving Average Convergence Divergence
- **VOL** - Volume
- **KDJ** - Stochastic Oscillator

## Visual Design

### Inactive State
- Background: `#141926`
- Text: `#6B7280` (gray)
- Border: transparent

### Active State
- Background: `#0F2847` (dark blue)
- Text: `#3B82F6` (blue)
- Border: `#3B82F6` (blue, 1px)

### Layout
- Pills: 12px horizontal padding, 5px vertical, 14px border radius
- Gap: 6px between pills
- Icon: Activity icon, 14px, gray
- Scrollable: Horizontal ScrollView without indicators

## Error Handling

All storage operations include try-catch blocks:
- Failed saves log warning but don't crash
- Failed loads return null, defaults used
- Storage unavailable doesn't break feature (works per-session)

## Performance Considerations

1. **Memoization**: IndicatorToggleList uses `React.memo` to prevent unnecessary re-renders
2. **Callback Stability**: `handleToggleIndicator` wrapped in `useCallback`
3. **Initial Save Skip**: Prevents redundant save on first mount
4. **Efficient Updates**: Only changed indicators trigger chart updates

## Testing

See `INDICATOR_FEATURE_TEST_PLAN.md` for comprehensive manual testing procedures.

### Quick Smoke Test
1. Open app → Trade tab
2. Toggle MA, RSI, MACD on
3. Verify chart shows indicators
4. Close and reopen app
5. Verify indicators still active

## Future Enhancements

Potential improvements for future iterations:

1. **Indicator Configuration**
   - Allow users to customize parameters (e.g., MA period, RSI overbought/oversold levels)
   - Add color customization for each indicator

2. **Preset Combinations**
   - "Trend Following" - MA + EMA
   - "Volatility" - BOLL + ATR
   - "Momentum" - RSI + MACD + KDJ
   - Custom user-saved presets

3. **Enhanced Persistence**
   - Per-market indicator preferences (BTC uses different indicators than ETH)
   - Cloud sync across devices
   - Export/import configurations

4. **UI Improvements**
   - Tooltips explaining each indicator
   - Quick info cards on long-press
   - Drag-to-reorder indicators
   - Hide/show toggle list itself

5. **Advanced Features**
   - Multiple indicator instances (e.g., MA(10) + MA(50))
   - Custom indicator formulas
   - Indicator alerts (notify when RSI crosses threshold)

## Dependencies

- `expo-secure-store`: "^15.0.8" (already in package.json)
- `react-native-webview`: "^13.6.4" (already in package.json)
- `klinecharts`: "^9.8.6" (already in package.json)

## Security

✅ CodeQL scan passed with 0 alerts  
✅ No sensitive data stored (only indicator names)  
✅ SecureStore provides encrypted storage on native platforms  
✅ Graceful fallback if storage unavailable

## Compatibility

- ✅ iOS: Full support via SecureStore
- ✅ Android: Full support via SecureStore  
- ⚠️ Web: SecureStore not available, falls back to session-only (feature still works but doesn't persist)

## Files Changed

| File | Type | Lines | Description |
|------|------|-------|-------------|
| `utils/indicatorStorage.ts` | New | 47 | Storage utility functions |
| `components/TradingInterface.tsx` | Modified | +18 | Load/save logic, imports |
| `INDICATOR_FEATURE_TEST_PLAN.md` | New | 135 | Testing documentation |
| `INDICATOR_IMPLEMENTATION.md` | New | - | This file |

**Total Lines Added**: ~200 (including docs)  
**Total Files Modified**: 2 (1 new utility, 1 enhanced component)

## Minimal Change Philosophy

This implementation follows the "minimal change" principle:

✅ **No UI changes** - Existing IndicatorToggleList already perfect  
✅ **No chart logic changes** - KLineChartWebView already handles indicators  
✅ **No new dependencies** - Uses existing expo-secure-store  
✅ **Surgical addition** - Only added persistence layer  
✅ **Backward compatible** - Defaults work for new users  
✅ **Non-breaking** - Feature works even if storage fails  

The existing codebase was already 95% complete. We only added the missing 5%: persistence.
