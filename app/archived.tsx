import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { useStore } from '@/providers/StoreProvider';
import { useHapticFeedback } from '@/hooks';
import { ThemeText, NoteCard, TaskCard, FolderCard, SectionTitle, PageHeader, PagedSections } from '@/components/ui';

export default function ArchivedScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { notes, folders, tasks, archiveNote, archiveFolder, archiveTask, toggleTask } = useStore();
  const { impact } = useHapticFeedback();

  const archivedFolders = folders.filter(f => f.archived);
  const archivedNotes = notes.filter(n => n.archived);
  const archivedTasks = tasks.filter(t => t.archived);

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

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      <PageHeader onBack={() => router.back()} caption="hidden items" title="archived" underlineWidth={62} />

      <PagedSections>
        {/* Page 1: Notes */}
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          {archivedNotes.length === 0 && (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <ThemeText variant="meta" color="ink4">no archived notes</ThemeText>
            </View>
          )}

          {archivedNotes.length > 0 && (
            <View>
              <View style={{ paddingHorizontal: 6, marginBottom: 12 }}>
                <SectionTitle underlineWidth={38}>notes</SectionTitle>
              </View>

              <View style={{ gap: 12 }}>
                {archivedNotes.map((note, i) => {
                  const folder = note.folder ? folders.find(f => f.id === note.folder) : undefined;
                  return (
                    <TouchableOpacity key={note.id} onPress={() => router.push(`/note/${note.id}`)} activeOpacity={0.85}>
                      <NoteCard note={note} folder={folder} index={i} onRestore={() => handleUnarchiveNote(note.id)} />
                    </TouchableOpacity>
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
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <ThemeText variant="meta" color="ink4">no archived tasks</ThemeText>
            </View>
          )}

          {archivedTasks.length > 0 && (
            <View>
              <View style={{ paddingHorizontal: 6, marginBottom: 12 }}>
                <SectionTitle underlineWidth={38}>tasks</SectionTitle>
              </View>

              <View style={{ gap: 12 }}>
                {archivedTasks.map((task, i) => {
                  const folder = task.folder ? folders.find(f => f.id === task.folder) : undefined;
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

        {/* Page 3: Folders */}
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          {archivedFolders.length === 0 && (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <ThemeText variant="meta" color="ink4">no archived folders</ThemeText>
            </View>
          )}

          {archivedFolders.length > 0 && (
            <View>
              <View style={{ paddingHorizontal: 6, marginBottom: 12 }}>
                <SectionTitle underlineWidth={52}>folders</SectionTitle>
              </View>

              <View style={{ gap: 12 }}>
                {archivedFolders.map((f, i) => {
                  const noteCount = notes.filter(n => n.folder === f.id).length;
                  const taskCount = tasks.filter(t => t.folder === f.id && !t.done).length;
                  return (
                    <FolderCard key={f.id} folder={f} index={i} noteCount={noteCount} taskCount={taskCount} onRestore={() => handleUnarchiveFolder(f.id)} />
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
      </PagedSections>
    </View>
  );
}
