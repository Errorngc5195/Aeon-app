import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { getTaskRepository } from './lib/repository';
import { AuthScreen } from './screens/AuthScreen';
import { TodayScreen } from './screens/TodayScreen';
import { BrainDumpScreen } from './screens/BrainDumpScreen';
import { ExtractionReviewScreen } from './screens/ExtractionReviewScreen';
import type { BrainDumpResult } from '@jee/shared-types';

// Top-level auth gate + simple state-based navigation. No navigation
// library yet — deliberately minimal per the current phase's UI guidance
// (functionality over polish). Screens: today -> brainDump -> review -> today.

type Screen = { name: 'today' } | { name: 'brainDump' } | { name: 'review'; result: BrainDumpResult };

function Root() {
  const { session, loading } = useAuth();
  const [screen, setScreen] = useState<Screen>({ name: 'today' });
  const [refreshKey, setRefreshKey] = useState(0);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!session) return <AuthScreen />;

  if (screen.name === 'brainDump') {
    return (
      <BrainDumpScreen
        onExtracted={(result) => setScreen({ name: 'review', result })}
        onCancel={() => setScreen({ name: 'today' })}
      />
    );
  }

  if (screen.name === 'review') {
    return (
      <ExtractionReviewScreen
        result={screen.result}
        repository={getTaskRepository()}
        onSaved={() => {
          setRefreshKey((k) => k + 1);
          setScreen({ name: 'today' });
        }}
        onBack={() => setScreen({ name: 'brainDump' })}
      />
    );
  }

  return <TodayScreen key={refreshKey} onOpenBrainDump={() => setScreen({ name: 'brainDump' })} />;
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
