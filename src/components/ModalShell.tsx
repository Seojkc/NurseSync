import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {shared} from '../styles/shared';

type Props = {
  visible: boolean;
  onClose: () => void; // backdrop tap
  onRequestClose?: () => void; // hardware back (defaults to onClose)
  maxHeightRatio?: number; // e.g. 0.85 = card never taller than 85% of the screen
  children: React.ReactNode;
};

// The dimmed backdrop + rounded white card every popup is built on.
export function ModalShell({
  visible,
  onClose,
  onRequestClose,
  maxHeightRatio,
  children,
}: Props) {
  const {height} = useWindowDimensions();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose ?? onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={shared.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            shared.modalCard,
            maxHeightRatio ? {maxHeight: height * maxHeightRatio} : undefined,
          ]}>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
