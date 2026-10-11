import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '@/services';
import { User } from '@/services/types/api.types';
import { KeyboardForm } from '@/components/ui/KeyboardForm';
import { Field } from '@/components/ui/Field';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { validateLocation, validateName, validatePhone } from '@/services/utils/validation';
import { color, space } from '@/theme';

/**
 * Edit name, location and phone. Email and user id can't be changed here, and the delivery
 * area is assigned by an admin.
 */
export function EditProfileForm({ user, onSaved, onCancel }: { user: User; onSaved: (updated: User) => void; onCancel: () => void }) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(user.full_name ?? '');
  const [location, setLocation] = useState(user.address ?? '');
  const [phone, setPhone] = useState(user.phone ?? '');
  const [errors, setErrors] = useState<{ name?: string; location?: string; phone?: string; form?: string }>({});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const next = {
      name: validateName(name) ?? undefined,
      location: validateLocation(location) ?? undefined,
      phone: validatePhone(phone) ?? undefined,
    };
    setErrors(next);
    if (next.name || next.location || next.phone) return;

    setSaving(true);
    try {
      const updated = await authService.updateProfile({ full_name: name.trim(), address: location.trim(), phone: phone.trim() });
      Alert.alert('Profile updated', 'Your details have been saved.');
      onSaved(updated);
    } catch (e: any) {
      setErrors({ form: e.message || 'Could not save your profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.surface, paddingTop: insets.top + space.md }}>
      <KeyboardForm contentContainerStyle={{ paddingHorizontal: space.md, paddingBottom: insets.bottom + space.xl }}>
        <AppText variant="h2" weight="bold" tone="brand" style={{ marginBottom: space.lg }}>
          Edit Profile
        </AppText>
        <Field label="Full name" value={name} onChangeText={setName} autoCapitalize="words" error={errors.name} />
        <Field label="Location" value={location} onChangeText={setLocation} error={errors.location} />
        <Field label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={errors.phone} />
        {errors.form ? (
          <AppText tone="danger" style={{ marginBottom: space.md }}>
            {errors.form}
          </AppText>
        ) : null}
        <AppButton title="Save changes" onPress={save} loading={saving} />
        <AppButton title="Cancel" variant="secondary" onPress={onCancel} disabled={saving} style={{ marginTop: space.md }} />
      </KeyboardForm>
    </View>
  );
}
