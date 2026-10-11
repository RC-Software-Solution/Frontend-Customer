import React, { ReactNode } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardForm } from '@/components/ui/KeyboardForm';
import { AppText } from '@/components/ui/AppText';
import { color, shadow, space } from '@/theme';

/**
 * The look shared by the sign-in family of screens: food photo on top, white rounded card
 * below that fills the rest of the screen, and the keyboard never hides the form.
 */
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardForm>
      <Image source={require('../../assets/signinback.jpg')} style={styles.image} />
      <View style={[styles.card, { paddingBottom: insets.bottom + space.xl }]}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? (
          <AppText tone="muted" style={styles.subtitle}>
            {subtitle}
          </AppText>
        ) : null}
        {children}
      </View>
    </KeyboardForm>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: 250, resizeMode: 'cover' },
  card: {
    flexGrow: 1,
    backgroundColor: color.surface,
    padding: space.lg,
    marginTop: -40,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    ...shadow.card,
  },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: space.sm },
  subtitle: { textAlign: 'center', marginBottom: space.lg },
});
