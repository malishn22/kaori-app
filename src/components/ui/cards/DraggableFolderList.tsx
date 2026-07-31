import React from 'react';
import { View } from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FolderCard } from './FolderCard';
import { TAB_BAR_BASE_HEIGHT } from '@/constants/layout';
import type { Folder } from '@/types';

type Props = {
  folders: Folder[];
  noteCounts: Record<string, number>;
  taskCounts: Record<string, number>;
  routineCounts: Record<string, number>;
  onReorder: (orderedIds: string[]) => void;
  onFolderPress: (id: string) => void;
};

export function DraggableFolderList({
  folders,
  noteCounts,
  taskCounts,
  routineCounts,
  onReorder,
  onFolderPress,
}: Props) {
  const insets = useSafeAreaInsets();

  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<Folder>) => {
    const index = getIndex()!;
    return (
      <ScaleDecorator>
        <View
          style={[
            { marginBottom: 14 },
            isActive ? { elevation: 8, shadowOpacity: 0.3, shadowRadius: 8 } : undefined,
          ]}
        >
          <FolderCard
            folder={item}
            index={index}
            noteCount={noteCounts[item.id] ?? 0}
            taskCount={taskCounts[item.id] ?? 0}
            routineCount={routineCounts[item.id] ?? 0}
            isDragging={isActive}
            onLongPress={drag}
            onPress={() => onFolderPress(item.id)}
          />
        </View>
      </ScaleDecorator>
    );
  };

  return (
    <DraggableFlatList
      data={folders}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      onDragBegin={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
      onDragEnd={({ data }) => onReorder(data.map((f) => f.id))}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 18,
        paddingTop: 24,
        paddingBottom: TAB_BAR_BASE_HEIGHT + insets.bottom + 180,
      }}
    />
  );
}
