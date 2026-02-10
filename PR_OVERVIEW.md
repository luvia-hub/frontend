Indicator Toggle Feature - Visual Flow Diagram
================================================

USER INTERFACE LAYOUT:
┌─────────────────────────────────────────────────────────────┐
│  Trade Tab - Trading Interface                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  BTC/USD                                        +2.4% ▲      │
│                                                               │
│  Mark: $64,230.50    Index: $64,215.10    24h: 1.2B        │
│                                                               │
│  ┌─ Time Intervals ─────────────────────────────────┐       │
│  │ [1m] [5m] [15m] [1h] [4h] [1D]          ⚙  ⤢   │       │
│  └───────────────────────────────────────────────────┘       │
│                                                               │
│  ┌─ Indicator Toggles ─────────────────────────────┐        │
│  │ ⚡  ┌────┐ ┌─────┐ ┌──────┐ ┌─────┐ ...  →      │        │
│  │     │ MA │ │ EMA │ │ BOLL │ │ RSI │             │        │
│  │     └────┘ └─────┘ └──────┘ └─────┘             │        │
│  │     [ACTIVE STATE: Blue background & border]    │        │
│  │     [INACTIVE STATE: Gray background]           │        │
│  └──────────────────────────────────────────────────┘        │
│                                                               │
│  ┌────────── K-Line Chart ──────────────────────┐           │
│  │                                                │           │
│  │  Main Pane (Candles + MA/EMA/BOLL overlay)   │           │
│  │  ┌──┐ ┌──┐    ┌──┐                           │           │
│  │  │  │ │  │ ┌──┤  │                           │           │
│  │  └──┘ │  │ │  └──┘                           │           │
│  │       └──┘ │      ~~~~ MA Line                │           │
│  │            └─     ---- EMA Line                │           │
│  │                   ···· BOLL Bands              │           │
│  ├────────────────────────────────────────────────┤           │
│  │  RSI Sub-Pane (if RSI active)                 │           │
│  │  70 ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ overbought                │           │
│  │     /\  /\                                     │           │
│  │  30 ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ oversold                  │           │
│  ├────────────────────────────────────────────────┤           │
│  │  MACD Sub-Pane (if MACD active)               │           │
│  │  ─────────── Signal & Histogram ─────────     │           │
│  ├────────────────────────────────────────────────┤           │
│  │  VOL Sub-Pane (if VOL active)                 │           │
│  │  ▌▌ ▌▌▌ ▌ ▌▌▌▌ ▌▌ Volume Bars                │           │
│  └────────────────────────────────────────────────┘           │
│                                                               │
│  [Order Book] [Recent Trades] [Info]                        │
│  ...                                                          │
└─────────────────────────────────────────────────────────────┘

INDICATOR INTERACTION FLOW:
1. User taps on "MA" pill
   ↓
2. Pill changes to blue (active state)
   ↓
3. handleToggleIndicator called
   ↓
4. setActiveIndicators([...prev, 'MA'])
   ↓
5. useEffect detects change → saveActiveIndicators(['VOL', 'MA'])
   ↓
6. SecureStore.setItemAsync('user_active_indicators', '["VOL","MA"]')
   ↓
7. activeIndicators prop passed to KLineChartWebView
   ↓
8. WebView injects: window.syncIndicators(['VOL', 'MA'])
   ↓
9. Chart.createIndicator('MA') on candle_pane
   ↓
10. MA line appears overlaid on candles

PERSISTENCE FLOW:
App Restart
   ↓
TradingInterface mounts
   ↓
useEffect (load) triggers
   ↓
loadActiveIndicators() called
   ↓
SecureStore.getItemAsync('user_active_indicators')
   ↓
Returns: '["VOL","MA"]'
   ↓
JSON.parse → ['VOL', 'MA']
   ↓
setActiveIndicators(['VOL', 'MA'])
   ↓
Chart renders with VOL and MA active
   ↓
User sees their previous selections restored ✓

INDICATOR PILL STATES:
                INACTIVE                     ACTIVE
           ┌──────────────┐           ┌──────────────┐
           │              │           │              │
           │      MA      │  →tap→    │      MA      │
           │              │           │              │
           └──────────────┘           └──────────────┘
           bg: #141926                bg: #0F2847
           text: #6B7280              text: #3B82F6
           border: transparent        border: #3B82F6

AVAILABLE INDICATORS:
┌──────────┬─────────────────────────────────┬───────────┐
│ Code     │ Name                            │ Pane Type │
├──────────┼─────────────────────────────────┼───────────┤
│ MA       │ Moving Average                  │ Main      │
│ EMA      │ Exponential Moving Average      │ Main      │
│ BOLL     │ Bollinger Bands                 │ Main      │
│ RSI      │ Relative Strength Index         │ Sub       │
│ MACD     │ Moving Average Convergence Div. │ Sub       │
│ VOL      │ Volume                          │ Sub       │
│ KDJ      │ Stochastic Oscillator          │ Sub       │
└──────────┴─────────────────────────────────┴───────────┘

Default: VOL (active by default for new users)
