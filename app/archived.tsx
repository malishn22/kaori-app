import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { useStore } from '@/providers/StoreProvider';
import { useHapticFeedback } from '@/hooks';
import { ThemeText, PaperCard, TaskCard, ProjectCard, SectionTitle, PageHeader, PagedSections } from '@/components/ui';

export default function ArchivedScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { notes, projects, tasks, archiveNote, archiveProject, archiveTask, toggleTask } = useStore();
  const { impact } = useHapticFeedback();

  const archivedProjects = projects.filter(p => p.archived);
  const archivedNotes = notes.filter(n => n.archived);
  const archivedTasks = tasks.filter(t => t.archived);

  async function handleUnarchiveProject(id: string) {
    await archiveProject(id, false);
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
                  const proj = note.project ? projects.find(p => p.id === note.project) : undefined;
                  return (
                    <TouchableOpacity key={note.id} onPress={() => router.push(`/note/${note.id}`)} activeOpacity={0.85}>
                      <PaperCard note={note} project={proj} index={i} onRestore={() => handleUnarchiveNote(note.id)} />
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
                  const proj = task.project ? projects.find(p => p.id === task.project) : undefined;
                  return (
                    <TaskCard
                      key={task.id}
                      task={task}
                      project={proj}
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

        {/* Page 3: Projects */}
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          {archivedProjects.length === 0 && (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <ThemeText variant="meta" color="ink4">no archived projects</ThemeText>
            </View>
          )}

          {archivedProjects.length > 0 && (
            <View>
              <View style={{ paddingHorizontal: 6, marginBottom: 12 }}>
                <SectionTitle underlineWidth={52}>projects</SectionTitle>
              </View>

              <View style={{ gap: 12 }}>
                {archivedProjects.map((p, i) => {
                  const noteCount = notes.filter(n => n.project === p.id).length;
                  const taskCount = tasks.filter(t => t.project === p.id && !t.done).length;
                  return (
                    <ProjectCard key={p.id} project={p} index={i} noteCount={noteCount} taskCount={taskCount} onRestore={() => handleUnarchiveProject(p.id)} />
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
