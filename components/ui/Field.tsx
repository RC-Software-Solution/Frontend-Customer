import React, { useState } from 'react';
import { TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { color, radius, space, type } from '@/theme';

type FieldProps = TextInputProps & {
  label?: string;
  error?: string;
  secure?: boolean;
};

export function Field({ label, error, secure = false, style, ...rest }: FieldProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <View style={{ marginBottom: space.md }}>
      {label ? (
        <AppText variant="caption" tone="muted" style={{ marginBottom: space.xs }}>
          {label}
        </AppText>
      ) : null}

      {/* Relative wrapper: the toggle is positioned against THIS box, so it
          follows the input regardless of what renders above it. */}
      <View style={{ position: 'relative', justifyContent: 'center' }}>
        <TextInput
          style={[
            {
              backgroundColor: color.field,
              borderRadius: radius.md,
              paddingHorizontal: space.md,
              paddingRight: secure ? space.xl + space.md : space.md,
              minHeight: 52,
              fontSize: type.body,
              color: color.ink,
              borderWidth: 1,
              borderColor: error ? color.danger : 'transparent',
            },
            style,
          ]}
          placeholderTextColor={color.subtle}
          secureTextEntry={secure && !revealed}
          {...rest}
        />

        {secure ? (
          <TouchableOpacity
            onPress={() => setRevealed((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{ position: 'absolute', right: space.md }}
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
