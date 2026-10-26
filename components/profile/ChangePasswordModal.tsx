import React, { useState } from 'react';
import { Alert, Modal, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '@/services';
import { KeyboardForm } from '@/components/ui/KeyboardForm';
import { Field } from '@/components/ui/Field';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { validateNewPassword } from '@/services/utils/validation';
import { color, space } from '@/theme';

/** Change your password while signed in. Other devices are signed out by the server. */
export function ChangePasswordModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string; form?: string }>({});
  const [saving, setSaving] = useState(false);

  const close = () => {
    setCurrent('');
    setNext('');
    setConfirm('');
    setErrors({});
    onClose();
  };

  const save = async () => {
    const found = {
      current: current ? undefined : 'Enter your current password',
      next: validateNewPassword(next) ?? (next === current ? 'Choose a different password from the current one' : undefined),
      confirm: next !== confirm ? 'Passwords do not match' : undefined,
    };
    setErrors(found);
    if (found.current || found.next || found.confirm) return;

    setSaving(true);
    try {
      await authService.changePassword(current, next);
      Alert.alert('Password changed', 'Your password has been updated. Your other devices were signed out.');
      close();
    } catch (e: any) {
      setErrors({ form: e.message || 'Could not change the password. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={close}>
      <View style={{ flex: 1, backgroundColor: color.surface, paddingTop: insets.top + space.md }}>
        <KeyboardForm contentContainerStyle={{ paddingHorizontal: space.md, paddingBottom: insets.bottom + space.xl }}>
          <AppText variant="h2" weight="bold" tone="brand" style={{ marginBottom: space.lg }}>
            Change Password
          </AppText>
          <Field label="Current password" secure placeholder="Your current password" value={current} onChangeText={setCurrent} error={errors.current} />
          <Field label="New password" secure placeholder="At least 6 characters" value={next} onChangeText={setNext} error={errors.next} />
          <Field label="Confirm new password" secure placeholder="Repeat the new password" value={confirm} onChangeText={setConfirm} error={errors.confirm} />
          {errors.form ? (
            <AppText tone="danger" style={{ marginBottom: space.md }}>
              {errors.form}
            </AppText>
          ) : null}
          <AppButton title="Change password" onPress={save} loading={saving} />
          <AppButton title="Cancel" variant="secondary" onPress={close} disabled={saving} style={{ marginTop: space.md }} />
        </KeyboardForm>
      </View>
    </Modal>
  );
}
