import React from 'react';
import { EmptyState } from './EmptyState';
import { AppText } from './AppText';
import { ErrorUtils } from '@/services/utils/error.utils';
import { space } from '@/theme';

// The shared "could not load" panel: red disc, title, one sentence, one retry button.
// Imports ErrorUtils from its own file, not the @/services barrel: screen tests mock the barrel wholesale.
export function ErrorState({
  title,
  error,
  onRetry,
  actionLabel = 'Tap to retry',
  message,
}: {
  title: string;
  error?: unknown;
  onRetry: () => void;
  actionLabel?: string;
  message?: string; // overrides the sentence derived from the error (see Order history)
}) {
  return (
    <EmptyState
      tone="error"
      icon="cloud-offline-outline"
      title={title}
      message={message ?? (ErrorUtils.isOffline(error) ? 'Check your connection and try again.' : 'Something went wrong. Please try again.')}
      actionLabel={actionLabel}
      onAction={onRetry}
    />
  );
}

// The one muted line a list shows above its rows when a refresh failed but the last data is still on screen.
export function StaleNotice() {
  return (
    <AppText variant="caption" tone="muted" accessibilityLiveRegion="polite" style={{ marginHorizontal: space.md, marginBottom: space.sm }}>
      Couldn't refresh. Pull down to try again.
    </AppText>
  );
}
