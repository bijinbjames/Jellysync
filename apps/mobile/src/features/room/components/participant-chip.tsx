import { View, Text } from 'react-native';

type ParticipantChipVariant = 'host' | 'participant' | 'empty';

interface FilledProps {
  variant: 'host' | 'participant';
  displayName: string;
  isMuted?: boolean;
}

interface EmptyProps {
  variant: 'empty';
  displayName?: never;
}

type ParticipantChipProps = FilledProps | EmptyProps;

function MicIcon({ color }: { color: string }) {
  return (
    <View className={`w-5 h-5 items-center justify-center`}>
      <Text className={`text-xs ${color}`}>{'\uD83C\uDF99'}</Text>
    </View>
  );
}

function MicOffIcon({ color }: { color: string }) {
  return (
    <View className="w-5 h-5 items-center justify-center">
      <Text className={`text-xs ${color}`}>{'\uD83C\uDF99'}</Text>
      <View className="absolute w-5 h-[1.5px] bg-error rotate-45" />
    </View>
  );
}

function Avatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <View className="w-10 h-10 rounded-full bg-surface-container-highest border-2 border-surface items-center justify-center">
      <Text className="text-on-surface font-display text-sm font-bold">
        {initial}
      </Text>
    </View>
  );
}

export function ParticipantChip(props: ParticipantChipProps) {
  if (props.variant === 'empty') {
    return (
      <View
        className="flex-row items-center p-3 rounded-xl border border-dashed border-outline-variant/30 opacity-60"
        accessibilityLabel="Slot available"
      >
        <View className="w-10 h-10 rounded-full border border-dashed border-outline-variant/30 items-center justify-center">
          <Text className="text-outline-variant text-lg">+</Text>
        </View>
        <Text className="ml-3 text-outline-variant font-body text-sm">
          Slot available
        </Text>
      </View>
    );
  }

  const { variant, displayName, isMuted } = props;
  const isHost = variant === 'host';
  const micColor = isMuted ? 'text-error' : isHost ? 'text-primary' : 'text-on-surface';

  return (
    <View
      className="flex-row items-center p-3 rounded-xl bg-surface-container"
      accessibilityLabel={`${displayName}${isHost ? ', Host' : ''}${isMuted ? ', muted' : ''}`}
    >
      <Avatar name={displayName} />
      <View className="flex-1 ml-3">
        <Text className="text-on-surface font-body text-sm font-medium">
          {displayName}
          {isHost && (
            <Text className="text-primary"> (Host)</Text>
          )}
        </Text>
      </View>
      {isMuted ? <MicOffIcon color={micColor} /> : <MicIcon color={micColor} />}
    </View>
  );
}
