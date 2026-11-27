import type { PropsWithChildren } from 'react';
import {
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { resolveResponsiveLayout } from '../theme/responsive';
import { tokens } from '../theme/tokens';

export function Screen({
  title,
  children,
  subtitle,
}: PropsWithChildren<{ title: string; subtitle?: string }>) {
  const { fontScale, width } = useWindowDimensions();
  const layout = resolveResponsiveLayout(width, fontScale);

  return (
    <SafeAreaView
      accessibilityLanguage="es-CL"
      style={styles.safe}
      edges={['left', 'right', 'bottom']}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: layout.horizontalPadding },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.heading}>
            <Text style={styles.eyebrow}>AQUABLOOM SUR</Text>
            <Text
              accessibilityRole="header"
              maxFontSizeMultiplier={2}
              style={[styles.title, layout.isCompact && styles.compactTitle]}
            >
              {title}
            </Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.colors.background },
  content: {
    paddingVertical: tokens.spacing.lg,
    gap: tokens.spacing.md,
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: tokens.colors.heading,
    letterSpacing: -0.6,
  },
  heading: { gap: 6, marginBottom: 4 },
  eyebrow: {
    color: tokens.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  subtitle: {
    color: tokens.colors.muted,
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 680,
  },
  compactTitle: { fontSize: 24 },
});
