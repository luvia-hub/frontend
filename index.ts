import './polyfills';
import { registerRootComponent } from 'expo';
import { StyleSheet } from 'react-native';

import App from './App';

const FONT_SIZE_REDUCTION_FACTOR = 0.9;
const originalCreate = StyleSheet.create;

StyleSheet.create = ((styles: any) =>
  originalCreate(
    Object.fromEntries(
      Object.entries(styles).map(([key, style]) => [
        key,
        style &&
        typeof style === 'object' &&
        !Array.isArray(style) &&
        'fontSize' in style &&
        typeof (style as { fontSize?: unknown }).fontSize === 'number'
          ? {
              ...style,
              fontSize: (style as { fontSize: number }).fontSize * FONT_SIZE_REDUCTION_FACTOR,
            }
          : style,
      ])
    ) as any
  )) as typeof StyleSheet.create;

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
