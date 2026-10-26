import React, { useEffect, useState } from 'react';
import { View, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Field } from '@/components/ui/Field';
import { color, radius, space } from '@/theme';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  requireText?: string;
}

const CancelModal: React.FC<ModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title = "Cancel Order",
  message = "Are you sure you want to cancel this order?",
  confirmText = "Yes",
  cancelText = "No",
  requireText,
}) => {
  const [typed, setTyped] = useState('');
  // Start empty every time the dialog opens or closes, so a stale answer never carries over.
  useEffect(() => { setTyped(''); }, [visible]);
  const canConfirm = !requireText || typed.trim() === requireText;

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <AppText variant="h2" weight="bold" style={styles.modalTitle}>{title}</AppText>
          <AppText variant="body" tone="muted" style={styles.modalText}>{message}</AppText>

          {requireText ? (
            <View style={styles.requireBox}>
              <AppText variant="caption" tone="muted" weight="semibold" style={styles.requireCaption}>Type {requireText} to confirm</AppText>
              <Field
                value={typed}
                onChangeText={setTyped}
                autoCapitalize="characters"
                autoCorrect={false}
                accessibilityLabel={`Type ${requireText} to confirm`}
              />
            </View>
          ) : null}

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose} accessibilityRole="button">
              <AppText variant="body" weight="bold" tone="ink">{cancelText}</AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton, !canConfirm && styles.confirmDisabled]}
              onPress={onConfirm}
              disabled={!canConfirm}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canConfirm }}
            >
              <AppText variant="body" weight="bold" tone="inverse">{confirmText}</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: color.scrim,
  },
  modalContent: {
    width: '80%',
    backgroundColor: color.surface,
    padding: space.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  modalTitle: {
    marginBottom: space.sm,
  },
  modalText: {
    marginBottom: space.lg,
    textAlign: 'center',
  },
  requireBox: {
    width: '100%',
  },
  requireCaption: {
    marginBottom: space.xs,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: space.md,
    marginHorizontal: space.xs,
    borderRadius: radius.md,
    alignItems: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: color.field,
  },
  confirmButton: {
    backgroundColor: color.danger,
  },
  confirmDisabled: {
    opacity: 0.4,
  },
});

export default CancelModal;
