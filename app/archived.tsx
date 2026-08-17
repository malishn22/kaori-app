import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useStore } from '@/providers/StoreProvider';
import { useCanvases } from '@/providers/CanvasProvider';
import { useHapticFeedback } from '@/hooks';
import {
  ThemeText,
  NoteCard,
  TaskCard,
  RoutineCard,
  FolderCard,
  SectionTitle,
  PageHeader,
  PagedSections,
} from '@/components/ui';

export default function ArchivedScreen() {
  const router = useRouter();
  const {
    notes,
    folders,
    tasks,
    routines,
    archiveNote,
    archiveFolder,
    archiveTask,
    toggleTask,
    archiveRoutine,
    toggleRoutineDone,
  } = useStore();
  // Canvases live in their own provider, not StoreProvider — see the note in CanvasProvider
  // on why a scene is not held in the whole-collection store.
  const { canvases, archiveCanvas } = useCanvases();
  const { impact } = useHapticFeedback();

  const archivedFolders = folders.filter((f) => f.archived);
  const archivedNotes = notes.filter((n) => n.archived);
  const archivedTasks = tasks.filter((t) => t.archived);
  const archivedRoutines = routines.filter((r) => r.archived);
  const archivedCanvases = canvases.filter((c) => c.archived);

  async function handleUnarchiveFolder(id: string) {
    await archiveFolder(id, false);
    impact();
  }

  async function handleUnarchiveNote(id: string) {
    await archiveNote(id, false);
    impact();
  }

  async function handleUnarchiveTask(id: string) {
    await archiveTask(id, false);
    impact();
  }

  async function handleUnarchiveRoutine(id: string) {
    await archiveRoutine(id, false);
    impact();
  }

  async function handleUnarchiveCanvas(id: string) {
    await archiveCanvas(id, false);
    impact();
  }

  return (
    <View className="flex-1 bg-theme-bg">
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      <PageHeader
        onBack={() => router.back()}
        caption="hidden items"
        title="archived"
        underlineWidth={62}
      />

      <PagedSections>
        {/* Page 1: Notes */}
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          {archivedNotes.length === 0 && (
            <View className="items-center pt-[60px]">
              <ThemeText variant="meta" color="ink4">
                no archived notes
              </ThemeText>
            </View>
          )}

          {archivedNotes.length > 0 && (
            <View>
              <View className="px-1.5 mb-3">
                <SectionTitle underlineWidth={38}>notes</SectionTitle>
              </View>

              <View className="gap-3">
                {archivedNotes.map((note, i) => {
                  const folder = note.folder
                    ? folders.find((f) => f.id === note.folder)
                    : undefined;
                  return (
                    <NoteCard
                      key={note.id}
                      note={note}
                      folder={folder}
                      index={i}
                      onPress={() => router.push(`/note/${note.id}`)}
                      onRestore={() => handleUnarchiveNote(note.id)}
                    />
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Page 2: Tasks */}
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          {archivedTasks.length === 0 && (
            <View className="items-center pt-[60px]">
              <ThemeText variant="meta" color="ink4">
                no archived tasks
              </ThemeText>
            </View>
          )}

          {archivedTasks.length > 0 && (
            <View>
              <View className="px-1.5 mb-3">
                <SectionTitle underlineWidth={38}>tasks</SectionTitle>
              </View>

              <View className="gap-3">
                {archivedTasks.map((task, i) => {
                  const folder = task.folder
                    ? folders.find((f) => f.id === task.folder)
                    : undefined;
                  return (
                    <TaskCard
                      key={task.id}
                      task={task}
                      folder={folder}
                      index={i}
                      onToggle={() => toggleTask(task.id)}
                      onPress={() => router.push(`/task/${task.id}`)}
                      onRestore={() => handleUnarchiveTask(task.id)}
                    />
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Page 3: Routines */}
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          {archivedRoutines.length === 0 && (
            <View className="items-center pt-[60px]">
              <ThemeText variant="meta" color="ink4">
                no archived routines
              </ThemeText>
            </View>
          )}

          {archivedRoutines.length > 0 && (
            <View>
              <View className="px-1.5 mb-3">
                <SectionTitle underlineWidth={38}>routines</SectionTitle>
              </View>

              <View className="gap-3">
                {archivedRoutines.map((routine, i) => (
                  <RoutineCard
                    key={routine.id}
                    routine={routine}
                    index={i}
                    onToggleDone={() => toggleRoutineDone(routine.id)}
                    onPress={() => router.push(`/routine/${routine.id}`)}
                    onRestore={() => handleUnarchiveRoutine(routine.id)}
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Page 4: Folders */}
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          {archivedFolders.length === 0 && (
            <View className="items-center pt-[60px]">
              <ThemeText variant="meta" color="ink4">
                no archived folders
              </ThemeText>
            </View>
          )}

          {archivedFolders.length > 0 && (
            <View>
              <View className="px-1.5 mb-3">
                <SectionTitle underlineWidth={52}>folders</SectionTitle>
              </View>

              <View className="gap-3">
                {archivedFolders.map((f, i) => {
                  const noteCount = notes.filter((n) => n.folder === f.id).length;
                  const taskCount = tasks.filter((t) => t.folder === f.id && !t.done).length;
                  return (
                    <FolderCard
                      key={f.id}
                      folder={f}
                      index={i}
                      noteCount={noteCount}
                      taskCount={taskCount}
                      onRestore={() => handleUnarchiveFolder(f.id)}
                    />
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Page 5: Canvases. A plain row rather than a card — there is no CanvasCard, and a
            thumbnail would mean rendering every archived scene just to list its title, which
            is exactly what keeping scenes out of the metadata read avoids. */}
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          {archivedCanvases.length === 0 && (
            <View className="items-center pt-[60px]">
              <ThemeText variant="meta" color="ink4">
                no archived canvases
              </ThemeText>
            </View>
          )}

          {archivedCanvases.length > 0 && (
            <View>
              <View className="px-1.5 mb-3">
                <SectionTitle underlineWidth={52}>canvases</SectionTitle>
              </View>

              <View className="gap-3">
                {archivedCanvases.map((canvas) => (
                  <View
                    key={canvas.id}
                    className="flex-row items-center gap-3 rounded-xl border border-theme-line bg-theme-paper px-4 py-3"
                  >
                    <Pressable
                      className="flex-1"
                      onPress={() => router.push(`/canvas/${canvas.id}`)}
                    >
                      <ThemeText variant="title">{canvas.title || 'untitled'}</ThemeText>
                    </Pressable>
                    <Pressable
                      onPress={() => handleUnarchiveCanvas(canvas.id)}
                      hitSlop={10}
                      accessibilityLabel={`restore ${canvas.title || 'untitled'}`}
                    >
                      <ThemeText variant="meta" color="amber">
                        restore
                      </ThemeText>
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </PagedSections>
    </View>
  );
}
