import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

// @ts-ignore
import { KLINE_CHARTS_LIBRARY_JS } from './KLineChartLibrary';

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface CrosshairData {
  x?: number;
  y?: number;
  kLineData?: CandleData;
  paneId?: string;
}

interface KLineChartWebViewProps {
  data: CandleData[];
  width?: number;
  height?: number;
  theme?: 'dark' | 'light';
  interval?: string;
  activeIndicators?: string[];
  onCrosshairChange?: (data: CrosshairData | null) => void;
}

export default function KLineChartWebView({
  data,
  width,
  height = 300,
  theme = 'dark',
  interval = '15m',
  activeIndicators = [],
  onCrosshairChange,
}: KLineChartWebViewProps) {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        const indexHtmlAsset = Asset.fromModule(require('../assets/chart/index.html'));
        const mainJsAsset = Asset.fromModule(require('../assets/chart/main.js.txt'));

        await Promise.all([indexHtmlAsset.downloadAsync(), mainJsAsset.downloadAsync()]);

        if (indexHtmlAsset.localUri && mainJsAsset.localUri) {
          const indexHtml = await FileSystem.readAsStringAsync(indexHtmlAsset.localUri);
          const mainJs = await FileSystem.readAsStringAsync(mainJsAsset.localUri);

          const combinedHtml = indexHtml
            .replace('<!-- KLineChart Library will be injected here -->', `<script>${KLINE_CHARTS_LIBRARY_JS}</script>`)
            .replace('<!-- Main Logic will be injected here -->', `<script>window.theme='${theme}';</script><script>${mainJs}</script>`);

          setHtmlContent(combinedHtml);
        } else {
          console.error('Failed to download chart assets: localUri is missing');
        }
      } catch (e) {
        console.error('Failed to load chart assets', e);
      }
    };
    loadAssets();
  }, [theme]);

  // Update data when chart is ready or data changes
  useEffect(() => {
    if (webViewRef.current && !isLoading) {
      const dataString = JSON.stringify(data);
      const script = `window.updateChartData && window.updateChartData(${dataString}); true;`;
      webViewRef.current.injectJavaScript(script);
    }
  }, [data, isLoading]);

  // Update indicators when chart is ready or indicators change
  useEffect(() => {
    if (webViewRef.current && !isLoading) {
      const indicatorsString = JSON.stringify(activeIndicators);
      const script = `window.syncIndicators && window.syncIndicators(${indicatorsString}); true;`;
      webViewRef.current.injectJavaScript(script);
    }
  }, [activeIndicators, isLoading]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === 'ready') {
        setIsLoading(false);
        // Sync indicators on chart ready
        const indicatorsString = JSON.stringify(activeIndicators);
        webViewRef.current?.injectJavaScript(`window.syncIndicators && window.syncIndicators(${indicatorsString}); true;`);

        // Initial data load if available
        if (data.length > 0) {
          const dataString = JSON.stringify(data);
          const script = `window.updateChartData && window.updateChartData(${dataString}); true;`;
          webViewRef.current?.injectJavaScript(script);
        }
      } else if (message.type === 'crosshair' && onCrosshairChange) {
        onCrosshairChange(message.data);
      } else if (message.type === 'log') {
        console.log('WebView Log:', message.data);
      } else if (message.type === 'error') {
        console.error('WebView Error:', message.data);
      }
    } catch (error) {
      console.warn('Failed to parse WebView message', error);
    }
  };

  if (!htmlContent) {
    return (
      <View style={[styles.container, { height, width: width || '100%' }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent, baseUrl: '' }}
        style={[styles.webview, { width: width || '100%', height }]}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
        androidLayerType="hardware"
        onMessage={handleMessage}
        originWhitelist={['*']}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0A0E17',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  webview: {
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0E17',
    zIndex: 1,
  },
});
