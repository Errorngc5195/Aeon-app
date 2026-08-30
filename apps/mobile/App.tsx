import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { AuthScreen } from './screens/AuthScreen';
import { TodayScreen } from './screens/TodayScreen';

// Top-level auth gate. No navigation library yet — deliberately minimal
// per the current phase's UI guidance (functionality over polish).
// Screens beyond Today (Brain Dump, Extraction Review, Tasks) get added
// as simple conditional renders here until real navigation is warranted.

function Root() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return session ? <TodayScreen /> : <AuthScreen />;
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
