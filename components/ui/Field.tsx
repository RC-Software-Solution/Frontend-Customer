import React, { useState } from 'react';
import { TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { color, radius, space, type } from '@/theme';

const TOGGLE_SIZE = 48;

type FieldProps = TextInputProps & {
  label?: string;
  error?: string;
  secure?: boolean;
  ref?: React.Ref<TextInput>;
};

export function Field({ label, error, secure = false, style, onFocus, onBlur, ...rest }: FieldProps) {
  const [revealed, setRevealed] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ marginBottom: space.md }}>
      {label ? (
        <AppText variant="caption" tone="muted" weight="semibold" style={{ marginBottom: space.xs }}>
          {label}
        </AppText>
      ) : null}

      {/* Relative wrapper: the toggle is positioned against THIS box, so it
          follows the input regardless of what renders above it. */}
      <View style={{ position: 'relative', justifyContent: 'center' }}>
        <TextInput
          style={[
            {
              backgroundColor: focused ? color.surface : color.field,
              borderRadius: radius.md,
              paddingHorizontal: space.md,
              paddingRight: secure ? TOGGLE_SIZE : space.md,
              minHeight: 52,
              fontSize: type.body,
              color: color.ink,
              borderWidth: 2,
              borderColor: error ? color.danger : focused ? color.brandStrong : 'transparent',
            },
            style,
          ]}
          placeholderTextColor={color.subtle}
          secureTextEntry={secure && !revealed}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />

        {secure ? (
          <TouchableOpacity
            onPress={() => setRevealed((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            style={{ position: 'absolute', right: 0, width: TOGGLE_SIZE, height: TOGGLE_SIZE, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={color.muted}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <AppText variant="caption" tone="danger" style={{ marginTop: space.xs }}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
