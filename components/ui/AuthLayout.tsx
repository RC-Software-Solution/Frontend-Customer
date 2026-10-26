import React, { ReactNode } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardForm } from '@/components/ui/KeyboardForm';
import { AppText } from '@/components/ui/AppText';
import { color, radius, space, status } from '@/theme';

/**
 * The look shared by the sign-in family of screens: a 16:9 food photo with a scrim and the
 * brand lines, a white sheet that overlaps it and fills the rest of the screen, and the
 * keyboard never hides the form.
 */
export function AuthLayout({
  title,
  subtitle,
  eyebrow,
  onBack,
  children,
}: {
  title: string;
  subtitle?: string;
  /** small brand line above the title, e.g. "Step 1 of 2" */
  eyebrow?: string;
  /** shows a back arrow over the photo */
  onBack?: () => void;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardForm>
      <View testID="auth-hero" style={styles.hero}>
        <Image
          source={require('../../assets/signinback.jpg')}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          accessible={false}
        />
        <View testID="auth-hero-scrim" pointerEvents="none" style={styles.scrim} />
        <View style={styles.heroText}>
          <AppText variant="h1" weight="bold" tone="inverse">
            RC Caterings
          </AppText>
          <AppText variant="caption" weight="semibold" tone="inverse">
            Fresh home-style meals, delivered
          </AppText>
        </View>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={[styles.back, { top: insets.top + space.sm }]}
          >
            <Ionicons name="arrow-back" size={24} color={color.brandInk} />
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={[styles.sheet, { paddingBottom: insets.bottom + space.xl }]}>
        {eyebrow ? (
          <AppText variant="caption" weight="bold" tone="brand" style={styles.eyebrow}>
            {eyebrow}
          </AppText>
        ) : null}
        <AppText variant="h1" weight="bold" style={styles.title}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="body" tone="muted" style={styles.subtitle}>
            {subtitle}
          </AppText>
        ) : null}
        {children}
      </View>
    </KeyboardForm>
  );
}

/** Account-status and connection problems that do not belong to one field. */
export function AuthBanner({ message }: { message: string }) {
  return (
    <View accessible accessibilityRole="alert" style={styles.banner}>
      <Ionicons name="alert-circle-outline" size={22} color={status.delivery_failed.fg} />
      <AppText
        variant="caption"
        weight="bold"
        style={{ color: status.delivery_failed.fg, flex: 1, marginLeft: space.sm }}
      >
        {message}
      </AppText>
    </View>
  );
}

/** "Don't have an account? Sign Up": a muted prompt and a 48dp text button. */
export function AuthFooterLink({
  prompt,
  action,
  onPress,
}: {
  prompt: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.footer}>
      <AppText variant="caption" tone="muted">
        {prompt}
      </AppText>
      <TouchableOpacity
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={action}
        style={styles.footerAction}
      >
        <AppText variant="caption" weight="bold" tone="brand">
          {action}
        </AppText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', aspectRatio: 16 / 9 },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: color.scrim },
  heroText: { position: 'absolute', left: space.md, bottom: space.xl },
  back: {
    position: 'absolute',
    left: space.md,
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.scrim,
  },
  sheet: {
    flexGrow: 1,
    backgroundColor: color.surface,
    paddingHorizontal: space.md,
    paddingTop: space.lg,
    marginTop: -space.lg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  eyebrow: { textAlign: 'left', marginBottom: space.xs },
  title: { textAlign: 'left', marginBottom: space.xs },
  subtitle: { textAlign: 'left', marginBottom: space.lg },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: status.delivery_failed.bg,
    borderRadius: radius.md,
    padding: space.md,
    marginBottom: space.md,
  },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: space.md },
  footerAction: { minHeight: 48, paddingHorizontal: space.sm, alignItems: 'center', justifyContent: 'center' },
});
