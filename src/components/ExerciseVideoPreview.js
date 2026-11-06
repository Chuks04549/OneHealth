import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { BorderRadius, Colors, Spacing, Typography } from '../theme';

const SEARCH_VARIATIONS = [
  (name) => `${name} exercise proper form #shorts`,
  (name) => `${name} technique demonstration #shorts`,
  (name) => `${name} quick form guide #shorts`,
  (name) => `${name} common mistakes #shorts`,
];

const PLAYER_ORIGIN = 'https://com.iban.onehealth';

const ALLOWED_HOSTS = [
  'youtube.com',
  'youtube-nocookie.com',
  'youtu.be',
  'googlevideo.com',
  'ytimg.com',
  'google.com',
  'gstatic.com',
];

function extractYouTubeVideoId(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'youtu.be' || parsed.hostname.endsWith('.youtu.be')) {
      return parsed.pathname.split('/').filter(Boolean)[0] || null;
    }
    if (parsed.pathname.startsWith('/shorts/')) return parsed.pathname.split('/')[2] || null;
    if (parsed.pathname.startsWith('/embed/')) return parsed.pathname.split('/')[2] || null;
    return parsed.searchParams.get('v');
  } catch (error) {
    return null;
  }
}

function isAllowedVideoUrl(url, playerMode) {
  if (!url || url === 'about:blank') return true;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    if (playerMode) {
      if (parsed.origin === PLAYER_ORIGIN) return true;
      const isEmbeddedPlayer = (
        parsed.hostname.endsWith('youtube-nocookie.com')
        || parsed.hostname.endsWith('youtube.com')
      ) && parsed.pathname.startsWith('/embed/');
      const isPlayerAsset = ['googlevideo.com', 'ytimg.com', 'gstatic.com'].some(
        (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`),
      );
      return isEmbeddedPlayer || isPlayerAsset;
    }
    return ALLOWED_HOSTS.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`));
  } catch (error) {
    return false;
  }
}

export default function ExerciseVideoPreview({ exerciseName }) {
  const [variation, setVariation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [videoId, setVideoId] = useState(null);
  const [seenVideoIds, setSeenVideoIds] = useState([]);

  const searchUrl = useMemo(() => {
    const query = SEARCH_VARIATIONS[variation](exerciseName);
    return `https://m.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  }, [exerciseName, variation]);

  const finderScript = useMemo(() => `
    (function () {
      var excludedVideoIds = ${JSON.stringify(seenVideoIds)};
      var attempts = 0;
      var timer = setInterval(function () {
        attempts += 1;
        var links = Array.prototype.slice.call(document.querySelectorAll('a[href*="/shorts/"]'));
        var uniqueLinks = links.filter(function (link, index, all) {
          return link.href && all.findIndex(function (other) { return other.href === link.href; }) === index;
        });
        var unseenLinks = uniqueLinks.filter(function (link) {
          try {
            var pathParts = new URL(link.href).pathname.split('/').filter(Boolean);
            var candidateId = pathParts[0] === 'shorts' ? pathParts[1] : null;
            return candidateId && excludedVideoIds.indexOf(candidateId) === -1;
          } catch (error) {
            return false;
          }
        });
        if (unseenLinks.length) {
          clearInterval(timer);
          var selected = unseenLinks[0];
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'video', url: selected.href }));
        } else if (attempts >= 40) {
          clearInterval(timer);
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'not-found' }));
        }
      }, 500);
    })();
    true;
  `, [seenVideoIds]);

  const playerUrl = videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?playsinline=1&controls=1&rel=0&fs=1&iv_load_policy=3&modestbranding=1&origin=${encodeURIComponent(PLAYER_ORIGIN)}`
    : null;

  const playerHtml = useMemo(() => {
    if (!playerUrl) return null;
    return `<!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
          <meta name="referrer" content="strict-origin-when-cross-origin" />
          <style>
            html, body, iframe { width: 100%; height: 100%; margin: 0; padding: 0; border: 0; background: #000; overflow: hidden; }
          </style>
        </head>
        <body>
          <iframe
            src="${playerUrl}"
            title="${exerciseName.replace(/[&<>"']/g, '')} exercise preview"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
            referrerpolicy="strict-origin-when-cross-origin"
          ></iframe>
        </body>
      </html>`;
  }, [exerciseName, playerUrl]);

  const webViewSource = videoId
    ? { html: playerHtml, baseUrl: `${PLAYER_ORIGIN}/` }
    : { uri: searchUrl };

  const selectVideo = (url) => {
    const nextVideoId = extractYouTubeVideoId(url);
    if (!nextVideoId || nextVideoId === videoId || seenVideoIds.includes(nextVideoId)) return false;
    setFailed(false);
    setLoading(true);
    setSeenVideoIds((current) => (
      current.includes(nextVideoId) ? current : [...current, nextVideoId]
    ));
    setVideoId(nextVideoId);
    return true;
  };

  const searchAgain = () => {
    setFailed(false);
    setLoading(true);
    setVideoId(null);
    setVariation((current) => (current + 1) % SEARCH_VARIATIONS.length);
  };

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <Text style={styles.title}>Preview</Text>
      </View>

      <View style={styles.playerShell}>
        {failed ? (
          <View style={styles.errorState}>
            <Feather name="wifi-off" size={28} color={Colors.textLight} />
            <Text style={styles.errorTitle}>Video previews could not be loaded</Text>
            <Text style={styles.errorText}>Check your internet connection and try another search.</Text>
          </View>
        ) : (
          <WebView
            key={videoId ? `player-${videoId}` : searchUrl}
            source={webViewSource}
            style={styles.webView}
            originWhitelist={['https://*']}
            onShouldStartLoadWithRequest={(request) => {
              if (!videoId && extractYouTubeVideoId(request.url)) {
                selectVideo(request.url);
                return false;
              }
              return isAllowedVideoUrl(request.url, Boolean(videoId));
            }}
            injectedJavaScript={!videoId ? finderScript : undefined}
            onMessage={(event) => {
              try {
                const message = JSON.parse(event.nativeEvent.data);
                if (message.type === 'video') selectVideo(message.url);
                if (message.type === 'not-found') {
                  setLoading(false);
                  setFailed(true);
                }
              } catch (error) {
                // Ignore messages not created by the preview finder.
              }
            }}
            allowsInlineMediaPlayback
            allowsFullscreenVideo
            mediaPlaybackRequiresUserAction
            javaScriptEnabled
            domStorageEnabled
            setSupportMultipleWindows={false}
            startInLoadingState
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => {
              if (videoId) setLoading(false);
            }}
            onError={() => {
              setLoading(false);
              setFailed(true);
            }}
            onHttpError={(event) => {
              if (event.nativeEvent.statusCode >= 400) {
                setLoading(false);
                setFailed(true);
              }
            }}
            renderLoading={() => (
              <View style={styles.loadingState}>
                <ActivityIndicator color={Colors.primary} />
              </View>
            )}
          />
        )}
        {loading && !failed ? (
          <View pointerEvents="none" style={styles.loadingOverlay}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : null}
      </View>

      <TouchableOpacity style={styles.searchButton} onPress={searchAgain} accessibilityRole="button">
        <Feather name="refresh-cw" size={18} color={Colors.primary} />
        <Text style={styles.searchButtonText}>Search for a different preview</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: Spacing.xxl },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  title: { color: Colors.text, fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold },
  playerShell: {
    height: 280,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundSecondary,
  },
  webView: { flex: 1, backgroundColor: Colors.backgroundSecondary },
  loadingState: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.backgroundSecondary },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.backgroundSecondary },
  errorState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  errorTitle: { color: Colors.text, fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, textAlign: 'center', marginTop: Spacing.md },
  errorText: { color: Colors.textSecondary, fontSize: Typography.fontSize.sm, lineHeight: 20, textAlign: 'center', marginTop: Spacing.sm },
  searchButton: {
    minHeight: 48,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.primaryLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  searchButtonText: { color: Colors.primaryDark, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold },
});
