/**
 * Node.js polyfills required for Web3Auth, ethers, and other crypto libraries
 * in React Native (Hermes) environment.
 *
 * This file MUST be imported before any other module in index.ts.
 * Import order matters — do not rearrange.
 */

// 0. Ensure all console methods exist — loglevel (used by @web3auth/base)
//    calls console[method].bind(console) which crashes if method is undefined.
const consoleMethods = ['trace', 'debug', 'info', 'warn', 'error', 'log', 'dir', 'table', 'group', 'groupEnd', 'groupCollapsed', 'time', 'timeEnd', 'timeLog', 'clear', 'count', 'countReset', 'assert', 'profile', 'profileEnd'] as const;
for (const method of consoleMethods) {
    if (typeof (console as any)[method] === 'undefined') {
        (console as any)[method] = typeof console.log === 'function'
            ? console.log.bind(console)
            : () => { };
    }
}

// 1. crypto.getRandomValues — MUST be before ethers/web3auth imports
import 'react-native-get-random-values';

// 2. Buffer global
import { Buffer } from 'buffer';
if (typeof globalThis.Buffer === 'undefined') {
    (globalThis as any).Buffer = Buffer;
}

// 3. Ethers.js Node.js shims (crypto, etc.)
import '@ethersproject/shims';

// 4. Ensure process.env exists — some web3 libraries check process.env.NODE_ENV
if (typeof globalThis.process === 'undefined') {
    (globalThis as any).process = { env: {} };
} else if (typeof globalThis.process.env === 'undefined') {
    (globalThis as any).process.env = {};
}

// 5. Polyfill process.nextTick - required by some dependencies (e.g. readable-stream)
if (typeof (globalThis as any).process.nextTick === 'undefined') {
    (globalThis as any).process.nextTick = (callback: (...args: any[]) => void, ...args: any[]) => {
        setTimeout(() => callback(...args), 0);
    };
} else if (typeof (globalThis as any).process.nextTick !== 'function') {
    // If it exists but is not a function (rare edge case), overwrite it
    (globalThis as any).process.nextTick = (callback: (...args: any[]) => void, ...args: any[]) => {
        setTimeout(() => callback(...args), 0);
    };
}
