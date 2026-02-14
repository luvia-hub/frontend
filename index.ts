import './polyfills';
import { registerRootComponent } from 'expo';
import { StyleSheet } from 'react-native';

import App from './App';

const FONT_SIZE_SCALE_FACTOR = 0.9;
const originalCreate = StyleSheet.create;

const scaleFontSize = <T,>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((entry) => scaleFontSize(entry)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        key === 'fontSize' && typeof entry === 'number'
          ? entry * FONT_SIZE_SCALE_FACTOR
          : scaleFontSize(entry),
      ])
    ) as T;
  }

  return value;
};

StyleSheet.create = ((styles) => originalCreate(scaleFontSize(styles))) as typeof StyleSheet.create;

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
