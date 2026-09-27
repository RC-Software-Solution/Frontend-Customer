import React, { ReactNode } from 'react';
import { ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, space } from '@/theme';
import { TAB_BAR_GAP, TAB_BAR_HEIGHT } from '@/theme/layout';

type PaddingOpts = { tabBar?: boolean; gutters?: boolean };

/**
 * Resolves the four things every screen needs: top inset, bottom inset,
 * floating-tab-bar clearance, and horizontal gutters.
 *
 * Exported for screens that cannot use <Screen> — Home (floating cart FAB
 * must sit outside the scroll container) and the auth screens (full-bleed
 * image above a curved panel, so the top inset applies to the image).
 */
export function useScreenPadding({ tabBar = false, gutters = true }: PaddingOpts = {}) {
  const insets = useSafeAreaInsets();
  return {
    paddingTop: insets.top + space.md,
    paddingBottom:
      insets.bottom + space.md + (tabBar ? TAB_BAR_HEIGHT + TAB_BAR_GAP : 0),
    paddingHorizontal: gutters ? space.md : 0,
  };
}

type ScreenProps = PaddingOpts & {
  scroll?: boolean;
  background?: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

export function Screen({
  scroll = false,
  tabBar = false,
  gutters = true,
  background = color.surface,
  style,
  children,
}: ScreenProps) {
  const padding = useScreenPadding({ tabBar, gutters });

  if (scroll) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: background }}
        contentContainerStyle={[{ flexGrow: 1, ...padding }, style]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={[{ flex: 1, backgroundColor: background, ...padding }, style]}>
      {children}
    </View>
  );
}
