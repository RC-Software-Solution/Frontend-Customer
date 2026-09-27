import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { color, radius, space } from '@/theme';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

const CancelModal: React.FC<ModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title = "Cancel Order",
  message = "Are you sure you want to cancel this order?",
  confirmText = "Yes",
  cancelText = "No",
}) => {
  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalText}>{message}</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <AppText variant="body" weight="bold" tone="ink">{cancelText}</AppText>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={onConfirm}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
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
});

export default CancelModal;
