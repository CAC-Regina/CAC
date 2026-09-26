import { StatusBar } from 'expo-status-bar';
import { Button, StyleSheet, Text, View } from 'react-native';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthGate from './components/AuthGate';

// Placeholder home screen: replace with your real app.
function Home() {
  const { user, signOut } = useAuth();
  return (
    <View style={styles.container}>
      <Text>Signed in as {user?.email}</Text>
      <Button title="Log out" onPress={signOut} />
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate>
        <Home />
      </AuthGate>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
});
