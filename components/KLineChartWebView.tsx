import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

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
  onCrosshairChange?: (data: CrosshairData | null) => void;
}

export default function KLineChartWebView({
  data,
  width,
  height = 300,
  theme = 'dark',
  interval = '15m',
  onCrosshairChange,
}: KLineChartWebViewProps) {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  // console.log('data', data);

  useEffect(() => {
    if (webViewRef.current) {
      const dataString = JSON.stringify(data);
      const script = `window.updateChartData(${dataString}); true;`;
      webViewRef.current.injectJavaScript(script);
    }
  }, [data]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === 'ready') {
        if (data.length > 0) {
          const dataString = JSON.stringify(data);
          const script = `window.updateChartData(${dataString}); true;`;
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

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: ${theme === 'dark' ? '#0A0E17' : '#FFFFFF'};
    }
    #chart {
      width: 100vw;
      height: 100vh;
    }
  </style>
</head>
<body style="background-color: '#FFFFFF';">
  <div id="chart"></div>
  <script>
    ${KLINE_CHARTS_LIBRARY_JS}
  </script>
  <script>
    window.onerror = function(message, source, lineno, colno, error) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          data: message + ' at ' + source + ':' + lineno + ':' + colno
        }));
      }
    };
    function log(msg) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'log',
          data: msg
        }));
      }
    }
  </script>
  <script>
    let chart = null;

    function initChart() {
      if (!window.klinecharts) {
        log('klinecharts not found yet, retrying...');
        setTimeout(initChart, 100);
        return;
      }
      log('klinecharts found, initializing...');

      try {
        chart = window.klinecharts.init('chart');
        log('chart initialized');

        // Configure chart theme
        const isDark = ${theme === 'dark'};
        chart.setStyles({
          grid: {
            show: true,
            horizontal: {
              show: true,
              size: 1,
              color: isDark ? '#1E293B' : '#E5E7EB',
              style: 'solid',
            },
            vertical: {
              show: true,
              size: 1,
              color: isDark ? '#1E293B' : '#E5E7EB',
              style: 'solid',
            },
          },
          candle: {
            type: 'candle_solid',
            bar: {
              upColor: '#22C55E',
              downColor: '#EF4444',
              upBorderColor: '#22C55E',
              downBorderColor: '#EF4444',
              upWickColor: '#22C55E',
              downWickColor: '#EF4444',
            },
            tooltip: {
              showRule: 'none',
              showType: 'standard',
              text: {
                size: 12,
                family: 'Arial',
                weight: 'normal',
                color: isDark ? '#9CA3AF' : '#6B7280',
              },
            },
            priceMark: {
              show: true,
              high: {
                show: true,
                color: isDark ? '#9CA3AF' : '#6B7280',
                textMargin: 5,
                textSize: 10,
                textFamily: 'Arial',
                textWeight: 'normal',
              },
              low: {
                show: true,
                color: isDark ? '#9CA3AF' : '#6B7280',
                textMargin: 5,
                textSize: 10,
                textFamily: 'Arial',
                textWeight: 'normal',
              },
              last: {
                show: true,
                upColor: '#22C55E',
                downColor: '#EF4444',
                noChangeColor: isDark ? '#9CA3AF' : '#6B7280',
                line: {
                  show: true,
                  style: 'dashed',
                  dashValue: [4, 4],
                  size: 1,
                  color: '#3B82F6',
                },
                text: {
                  show: true,
                  size: 12,
                  paddingLeft: 4,
                  paddingTop: 4,
                  paddingRight: 4,
                  paddingBottom: 4,
                  color: '#FFFFFF',
                  family: 'Arial',
                  weight: 'normal',
                  borderRadius: 2,
                },
              },
            },
          },
          indicator: {
            tooltip: {
              showRule: 'always',
              showType: 'standard',
              text: {
                size: 12,
                family: 'Arial',
                weight: 'normal',
                color: isDark ? '#9CA3AF' : '#6B7280',
              },
            },
          },
          xAxis: {
            show: true,
            size: 'auto',
            axisLine: {
              show: true,
              color: isDark ? '#334155' : '#D1D5DB',
              size: 1,
            },
            tickText: {
              show: true,
              color: isDark ? '#9CA3AF' : '#6B7280',
              size: 12,
              family: 'Arial',
              weight: 'normal',
              marginStart: 4,
              marginEnd: 4,
            },
            tickLine: {
              show: true,
              size: 1,
              length: 3,
              color: isDark ? '#334155' : '#D1D5DB',
            },
          },
          yAxis: {
            show: true,
            size: 'auto',
            position: 'right',
            type: 'normal',
            inside: false,
            reverse: false,
            axisLine: {
              show: true,
              color: isDark ? '#334155' : '#D1D5DB',
              size: 1,
            },
            tickText: {
              show: true,
              color: isDark ? '#9CA3AF' : '#6B7280',
              size: 12,
              family: 'Arial',
              weight: 'normal',
              marginStart: 4,
              marginEnd: 4,
            },
            tickLine: {
              show: true,
              size: 1,
              length: 3,
              color: isDark ? '#334155' : '#D1D5DB',
            },
          },
          crosshair: {
            show: true,
            horizontal: {
              show: true,
              line: {
                show: true,
                style: 'dashed',
                dashValue: [4, 2],
                size: 1,
                color: '#3B82F6',
              },
              text: {
                show: true,
                color: '#FFFFFF',
                size: 12,
                family: 'Arial',
                weight: 'normal',
                paddingLeft: 4,
                paddingRight: 4,
                paddingTop: 4,
                paddingBottom: 4,
                borderSize: 1,
                borderColor: '#3B82F6',
                borderRadius: 2,
                backgroundColor: '#3B82F6',
              },
            },
            vertical: {
              show: true,
              line: {
                show: true,
                style: 'dashed',
                dashValue: [4, 2],
                size: 1,
                color: '#3B82F6',
              },
              text: {
                show: true,
                color: '#FFFFFF',
                size: 12,
                family: 'Arial',
                weight: 'normal',
                paddingLeft: 4,
                paddingRight: 4,
                paddingTop: 4,
                paddingBottom: 4,
                borderSize: 1,
                borderColor: '#3B82F6',
                borderRadius: 2,
                backgroundColor: '#3B82F6',
              },
            },
          },
        });

        // Create main pane with MA indicator
        chart.createIndicator('MA', false, { id: 'candle_pane' });

        // Create volume pane
        chart.createIndicator('VOL', false, { height: 80 });

        // Subscribe to crosshair events
        chart.subscribeAction('onCrosshairChange', (data) => {
          try {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'crosshair',
                data: data,
              }));
            }
          } catch (error) {
            console.error('Failed to send crosshair event', error);
          }
        });

        // Signal that chart is ready
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'ready',
          }));
        }
      } catch (e) {
        log('Error initializing chart: ' + e.message);
      }
    }

    window.updateChartData = function(data) {
      if (chart && Array.isArray(data)) {
        try {
          chart.applyNewData(data);
          // log('chart data updated: ' + data.length + ' points');
        } catch (e) {
          log('Error updating chart data: ' + e.message);
        }
      } else {
        log('updateChartData called but chart not ready or data invalid');
      }
    };

    // Initialize chart when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initChart);
    } else {
      initChart();
    }
  </script>
</body>
</html>
  `;

  return (
    <View style={[styles.container, { height }]}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={[styles.webview, { width: width || '100%', height }]}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
        androidLayerType="hardware"
        onMessage={handleMessage}
        onLoadEnd={() => setIsLoading(false)}
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
