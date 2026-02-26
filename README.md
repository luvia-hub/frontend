# Luvia Hub — Crypto Perpetual Trading Aggregator

A high-fidelity **React Native** mobile application that aggregates perpetual trading across multiple decentralized exchanges into a single, unified interface. Built with **Expo**, **TypeScript**, and **Web3Auth**.

---

## ✨ Features

### Multi-Exchange Aggregation

Trade perpetual contracts across five decentralized exchanges from one app:

| Exchange | Connection | Order Book | Chart Data |
|----------|-----------|------------|------------|
| **Hyperliquid** | WebSocket | Real | Real |
| **dYdX** | WebSocket | Real | Real |
| **GMX v2** | REST Polling | Simulated (AMM) | Real |
| **Lighter** | WebSocket | Real | Real |
| **Aster** | WebSocket | Real | Real |

### Advanced Charting

- Interactive candlestick charts powered by [**KLineCharts**](https://klinecharts.com/)
- Seven technical indicators: **MA**, **EMA**, **BOLL**, **RSI**, **MACD**, **VOL**, **KDJ**
- Time intervals: 1m, 5m, 15m, 1h, 4h, 1D
- Indicator preferences persist across sessions via SecureStore

### Web3Auth Authentication

- **Social Login** — Google OAuth, Apple Sign-In, Email Passwordless
- **Non-Custodial Wallets** — Users own their keys via MPC (Multi-Party Computation)
- **Session Persistence** — Automatic session restoration on app relaunch
- **Legacy Support** — Private key import for advanced users

### Trading

- **Order Types** — Market (IoC), Limit (GTC), Stop (Trigger-based)
- **EIP-712 Signing** — Typed-data signatures via `ethers.js`
- **Real-Time Data** — Live order book, recent trades, and price stats
- **Leverage Selection** — Configurable leverage per trade
- **Active Positions** — View and manage open positions

### Market Discovery

- Searchable market list with exchange badges
- Portfolio dashboard with asset overview
- Exchange connection sources management

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Expo](https://expo.dev) (SDK 54) / React Native 0.81 |
| **Language** | TypeScript (strict mode) |
| **State Management** | [Zustand](https://zustand-demo.pmnd.rs/) |
| **Server State** | [TanStack React Query](https://tanstack.com/query) |
| **Auth** | [Web3Auth](https://web3auth.io/) (React Native SDK) |
| **Blockchain** | [ethers.js](https://docs.ethers.org/v6/) v6 |
| **Charting** | [KLineCharts](https://klinecharts.com/) v9 (via WebView) |
| **Icons** | [Lucide React Native](https://lucide.dev/) |
| **Secure Storage** | expo-secure-store |
| **Styling** | React Native StyleSheet (dark theme) |

---

## 📁 Project Structure

```
frontend/
├── App.tsx                    # Root component — navigation & providers
├── index.ts                   # Entry point with polyfills
├── polyfills.ts               # Buffer & crypto polyfills
├── global.d.ts                # Global type declarations
│
├── components/
│   ├── TradingInterface.tsx    # Main trading screen
│   ├── MarketListScreen.tsx    # Market discovery & search
│   ├── DashboardScreen.tsx     # Portfolio overview
│   ├── ActivePositionsScreen   # Open positions view
│   ├── WalletConnectScreen.tsx # Authentication UI
│   ├── KLineChartWebView.tsx   # Chart WebView wrapper
│   ├── KLineChartLibrary.ts    # KLineCharts JS bundle
│   ├── trading/               # Trading sub-components
│   │   ├── useHyperliquidData  # Hyperliquid WebSocket hook
│   │   ├── useDydxData         # dYdX WebSocket hook
│   │   ├── useGmxData          # GMX REST polling hook
│   │   ├── useLighterData      # Lighter WebSocket hook
│   │   ├── useAsterData        # Aster WebSocket hook
│   │   ├── OrderBook.tsx       # Order book display
│   │   ├── RecentTrades.tsx    # Recent trades feed
│   │   ├── ActionButtons.tsx   # Buy/Sell with order logic
│   │   ├── IndicatorToggleList # Chart indicator toggles
│   │   └── ...                 # More trading UI components
│   └── ui/                    # Shared UI primitives
│
├── services/                  # Exchange API integrations
│   ├── hyperliquid.ts          # Hyperliquid API + signing
│   ├── dydx.ts                 # dYdX market data
│   ├── gmx.ts                  # GMX v2 REST API
│   ├── lighter.ts              # Lighter API
│   ├── aster.ts                # Aster API
│   └── exchangeService.ts      # Unified exchange interface
│
├── config/
│   └── web3auth.ts             # Web3Auth configuration
│
├── contexts/
│   └── WalletContext.tsx        # Wallet state & signing
│
├── stores/                    # Zustand stores
│   ├── useAppNavigationStore   # App navigation state
│   └── useMarketScreenStore    # Market screen filters
│
├── theme/                     # Design tokens
│   ├── colors.ts               # Dark-mode color palette
│   ├── typography.ts           # Font scales
│   ├── spacing.ts              # Spacing scale
│   └── radius.ts               # Border radius tokens
│
└── utils/
    ├── indicatorStorage.ts     # Indicator preference persistence
    └── exchangeStorage.ts      # Exchange preference persistence
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** (included with Node.js)
- **Expo CLI** — installed globally or via `npx`
- **iOS Simulator** (macOS) or **Android Emulator** / physical device
- **Expo Dev Client** — required for Web3Auth (Expo Go is not supported)

### Installation

```bash
# Clone the repository
git clone https://github.com/luvia-hub/frontend.git
cd frontend

# Install dependencies
npm install
```

### Running the App

```bash
# Start Expo dev server
npm start

# Or target a specific platform
npm run ios       # iOS Simulator
npm run android   # Android Emulator
npm run web       # Web browser
```

> [!IMPORTANT]
> Web3Auth requires a **development build** (not Expo Go). Run `npx expo prebuild` and build natively, or use EAS Build for device testing.

### EAS Build

```bash
# Development build (internal distribution)
eas build --profile development --platform ios

# Preview APK (Android)
eas build --profile preview --platform android

# Production
eas build --profile production --platform all
```

---

## ⚙️ Configuration

### Web3Auth

The Web3Auth client configuration is in `config/web3auth.ts`. Before deploying to production:

1. Replace the demo Client ID with a production key from the [Web3Auth Dashboard](https://dashboard.web3auth.io/)
2. Switch network from **Sapphire Devnet** to **Sapphire Mainnet**
3. Register your bundle identifiers (`com.luviahub.cryptotradingaggregator`)
4. Configure redirect URL scheme: `cryptotradingaggregator://auth`

### App Identifiers

| Platform | Identifier |
|----------|-----------|
| iOS | `com.luviahub.cryptotradingaggregator` |
| Android | `com.luviahub.cryptotradingaggregator` |
| URL Scheme | `cryptotradingaggregator` |

---

## 🧪 Development

### TypeScript

The project uses **strict** TypeScript. Check for errors with:

```bash
npx tsc --noEmit
```

### Project Conventions

- **Dark theme only** — all colors defined in `theme/colors.ts`
- **Exchange hooks** follow the pattern `use<Exchange>Data.ts` returning unified `CandleData`, `OrderBookEntry`, and `TradeData` types
- **Services** handle raw API communication; hooks manage state and real-time connections
- **Zustand** for client-side navigation/UI state; **React Query** for server state

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `expo` ~54 | App framework & build system |
| `react-native` 0.81 | Native rendering (New Architecture enabled) |
| `@web3auth/react-native-sdk` | Social login & MPC wallets |
| `ethers` v6 | EIP-712 signing & wallet management |
| `@far1s/hyperliquid` | Hyperliquid SDK (React Native build) |
| `klinecharts` v9 | Professional candlestick charting |
| `zustand` v5 | Lightweight state management |
| `@tanstack/react-query` v5 | Async state & caching |
| `lucide-react-native` | Icon library |
| `expo-secure-store` | Encrypted key-value storage |
| `react-native-webview` | Chart rendering container |

---

## 🔒 Security

- **Non-custodial wallets** — private keys are never stored on servers
- **MPC key management** — via Web3Auth's threshold signature scheme
- **Encrypted storage** — session tokens stored with `expo-secure-store`
- **EIP-712 typed signing** — human-readable transaction signing
- **CodeQL scanning** — automated security analysis in CI

---

## 🗺 Roadmap

- [ ] Production Web3Auth configuration
- [ ] Biometric authentication (Face ID / Fingerprint)
- [ ] Order history & trade analytics
- [ ] Portfolio P&L tracking
- [ ] Push notifications for price alerts & order fills
- [ ] Multi-chain support (Solana, Arbitrum, etc.)
- [ ] Cloud-synced user preferences

---

## 📄 Documentation

| Document | Description |
|----------|-------------|
| [IMPLEMENTATION.md](./IMPLEMENTATION.md) | Technical architecture & API reference |
| [WEB3AUTH_INTEGRATION.md](./WEB3AUTH_INTEGRATION.md) | Web3Auth setup & migration guide |
| [GMX_INTEGRATION.md](./GMX_INTEGRATION.md) | GMX v2 integration details |
| [FEATURE_SUMMARY.md](./FEATURE_SUMMARY.md) | Indicator persistence feature |
| [SECURITY_ANALYSIS.md](./SECURITY_ANALYSIS.md) | Security audit reports |

---

## 📱 Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| **iOS** | ✅ Full | Requires dev build for Web3Auth |
| **Android** | ✅ Full | Edge-to-edge enabled |
| **Web** | ⚠️ Partial | SecureStore unavailable; session-only persistence |

---

## 📝 License

Private — All rights reserved.
