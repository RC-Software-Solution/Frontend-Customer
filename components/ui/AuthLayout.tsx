import React, { ReactNode } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardForm } from '@/components/ui/KeyboardForm';
import { AppText } from '@/components/ui/AppText';
import { color, shadow, space } from '@/theme';

/**
 * The look shared by the sign-in family of screens: food photo on top, white rounded card
 * below that fills the rest of the screen, and the keyboard never hides the form.
 */
export function AuthLayout({
  title,
  subtitle,
  onBack,
  children,
}: {
  title: string;
  subtitle?: string;
  /** shows a back arrow over the photo */
  onBack?: () => void;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardForm>
      <View>
        <Image source={require('../../assets/signinback.jpg')} style={styles.image} />
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[styles.back, { top: insets.top + space.sm }]}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        ) : null}
      </View>
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
  back: {
    position: 'absolute',
    left: space.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
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
