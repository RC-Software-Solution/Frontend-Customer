import React from 'react';
import { View } from 'react-native';
import { AppText } from './AppText';
import { radius, space, status } from '@/theme';

export type OrderStatus = keyof typeof status;

const labels: Record<OrderStatus, string> = {
  pending: 'Pending',
  preparing: 'Preparing',
  delivering: 'On the way',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  delivery_failed: 'Delivery failed',
};

// `value` is a plain string because it comes from the server: a status added later must degrade to a
// neutral chip with its raw text, not crash the screen.
export function StatusChip({ value }: { value: string }) {
  const known = value in status;
  const { fg, bg } = known ? status[value as OrderStatus] : status.cancelled;
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: bg,
        borderRadius: radius.pill,
        paddingHorizontal: space.sm + 2,
        paddingVertical: space.xs,
      }}
    >
      <AppText variant="micro" weight="bold" style={{ color: fg }}>
        {known ? labels[value as OrderStatus] : value}
      </AppText>
    </View>
  );
}
