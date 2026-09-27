import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export const LoginScreen = () => {
  const { login, serverUrl, updateServerUrl } = useAuth();
  const [officerId, setOfficerId] = useState('COMMANDER-HQ-01');
  const [password, setPassword] = useState('Kavach@Command2026');
  const [urlInput, setUrlInput] = useState(serverUrl);
  const [showConfig, setShowConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    if (!officerId.trim() || !password.trim()) {
      setError('Please enter both Officer ID and Security Passphrase.');
      return;
    }

    try {
      setLoading(true);
      await updateServerUrl(urlInput);
      await login(officerId, password);
    } catch (e: any) {
      setError(e?.message || 'Authentication failed. Verify server connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFill = () => {
    setOfficerId('COMMANDER-HQ-01');
    setPassword('Kavach@Command2026');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Military Header */}
        <View style={styles.header}>
          <View style={styles.insigniaBadge}>
            <Text style={styles.insigniaText}>🛡️ BSF C4ISR</Text>
          </View>
          <Text style={styles.title}>KAVACH</Text>
          <Text style={styles.subtitle}>COMMANDER MOBILE CONSOLE</Text>
          <Text style={styles.classifiedTag}>LEVEL-5 TOP SECRET // HIGHER OFFICIALS ONLY</Text>
        </View>

        {/* Login Form Box */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>SECURE COMMAND TERMINAL</Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>OFFICER ID / SERVICE CALLSIGN</Text>
            <TextInput
              style={styles.input}
              value={officerId}
              onChangeText={setOfficerId}
              placeholder="e.g. COMMANDER-HQ-01"
              placeholderTextColor="#64748b"
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>TACTICAL PASSPHRASE</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter security passphrase"
              placeholderTextColor="#64748b"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.loginBtnText}>AUTHENTICATE & ACCESS COMMAND</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.autoFillBtn}
            onPress={handleAutoFill}
          >
            <Text style={styles.autoFillText}>⚡ Quick Fill Default Credentials</Text>
          </TouchableOpacity>

          {/* Server URL Config Toggle */}
          <TouchableOpacity
            style={styles.configToggle}
            onPress={() => setShowConfig(!showConfig)}
          >
            <Text style={styles.configToggleText}>
              {showConfig ? '▼ Hide Server Connection Settings' : '▶ Server Connection Settings'}
            </Text>
          </TouchableOpacity>

          {showConfig && (
            <View style={styles.configBox}>
              <Text style={styles.label}>BACKEND SERVER URL</Text>
              <TextInput
                style={styles.input}
                value={urlInput}
                onChangeText={setUrlInput}
                placeholder="http://localhost:8000"
                placeholderTextColor="#64748b"
                autoCapitalize="none"
              />
              <Text style={styles.configHint}>
                Use http://10.0.2.2:8000 for Android Emulator, or your LAN IP (e.g. http://192.168.1.10:8000) for physical mobile devices.
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Bharat Security Forces · Perimeter Defense & Crypto Ledger
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  insigniaBadge: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#38bdf8',
    marginBottom: 10,
  },
  insigniaText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  title: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 3,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 4,
  },
  classifiedTag: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 2,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  sectionHeader: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 8,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 4,
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  loginBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 6,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  autoFillBtn: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 4,
  },
  autoFillText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '600',
  },
  configToggle: {
    marginTop: 16,
    alignItems: 'center',
  },
  configToggleText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  configBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  configHint: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 4,
    lineHeight: 14,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    color: '#475569',
    fontSize: 10,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
