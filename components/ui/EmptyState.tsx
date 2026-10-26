import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { color, space, status } from '@/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// A vector icon on a tinted disc: zero image weight, works offline.
export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  tone = 'brand',
}: {
  icon: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'brand' | 'error';
}) {
  const disc = tone === 'error' ? status.delivery_failed : { bg: color.brandSoft, fg: color.brandStrong };
  return (
    <View style={{ alignItems: 'center', paddingHorizontal: space.lg, gap: space.sm }}>
      <View
        testID="empty-disc"
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: disc.bg,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: space.sm,
        }}
      >
        <Ionicons name={icon} size={32} color={disc.fg} />
      </View>
      <AppText variant="h2" weight="bold" style={{ textAlign: 'center' }}>
        {title}
      </AppText>
      {message ? (
        <AppText tone="muted" style={{ textAlign: 'center' }}>
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <AppButton title={actionLabel} onPress={onAction} style={{ marginTop: space.md, alignSelf: 'stretch' }} />
      ) : null}
    </View>
  );
}
