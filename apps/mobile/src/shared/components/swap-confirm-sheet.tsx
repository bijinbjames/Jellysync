import { Modal, View, Text, Pressable } from 'react-native';

interface SwapConfirmSheetProps {
  movieName: string;
  onConfirm: () => void;
  onCancel: () => void;
  visible: boolean;
}

export function SwapConfirmSheet({ movieName, onConfirm, onCancel, visible }: SwapConfirmSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <Pressable
        className="flex-1 bg-black/40 justify-end"
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="rounded-t-2xl border-t border-outline-variant/15 p-6 pb-safe bg-surface-container-high/80"
        >
          {/* Drag handle */}
          <View className="mx-auto mb-4 h-1 w-10 rounded-full bg-surface-container-high" />

          <Text className="text-on-surface font-heading text-lg font-bold text-center mb-6">
            Change to {'\u201C'}{movieName}{'\u201D'}?
          </Text>

          <Pressable
            onPress={onConfirm}
            accessibilityRole="button"
            accessibilityLabel="Change Movie"
            className="gradient-primary rounded-md min-h-[48px] items-center justify-center w-full"
          >
            <Text className="text-on-primary font-display text-base font-bold">
              Change Movie
            </Text>
          </Pressable>

          <Pressable
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            className="min-h-[48px] items-center justify-center w-full mt-2"
          >
            <Text className="text-primary font-body text-sm font-medium">
              Cancel
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
