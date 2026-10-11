import React, { useEffect, useRef } from 'react';
import { Keyboard, KeyboardAvoidingView, ScrollView, ScrollViewProps } from 'react-native';

/**
 * A scrollable form that stays usable while the on-screen keyboard is open.
 *
 * Android now draws edge-to-edge, so the window no longer shrinks for the keyboard and it
 * covers the bottom of the screen (the sign-in button, for example). KeyboardAvoidingView
 * with `padding` makes room on both platforms, and when the keyboard opens we scroll to the
 * bottom so the action button above it is visible.
 */
export function KeyboardForm({ children, contentContainerStyle, ...rest }: ScrollViewProps) {
  const scroll = useRef<ScrollView>(null);

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => scroll.current?.scrollToEnd({ animated: true }));
    return () => sub.remove();
  }, []);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView
        ref={scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[{ flexGrow: 1 }, contentContainerStyle]}
        {...rest}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
