import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, TextInput, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Body, BodyBold, Button, Card, Chip, H3, Page, Small, Tag, Title, useUI } from '@/components/ui';
import { useStore } from '@/data/store';
import { cleanVideoUrl, EXERCISE_CATEGORIES } from '@/data/structure';
import type { Exercise, ExerciseCategory } from '@/data/types';
import { fonts, radius, TOUCH } from '@/theme';

// Hogan's exercise library: add exercises by typing, sort them into
// categories, and paste in a video link once it's filmed.
export default function ExerciseLibrary() {
  const st = useStore();
  const { c } = useUI();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<ExerciseCategory | 'All' | 'None'>('All');
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const query = q.trim().toLowerCase();
  const list = st.exercises
    .filter((e) => (cat === 'All' ? true : cat === 'None' ? !e.category : e.category === cat))
    .filter((e) => !query || e.name.toLowerCase().includes(query))
    .sort((a, b) => a.name.localeCompare(b.name));
  const withVideo = st.exercises.filter((e) => e.videoUrl).length;
  const uncategorised = st.exercises.filter((e) => !e.category).length;
  const input = { minHeight: 50, borderWidth: 1.5, borderColor: c.line, borderRadius: radius.md, paddingHorizontal: 12, fontFamily: fonts.body, fontSize: 16, color: c.ink, backgroundColor: c.surface } as const;

  return (
    <Page maxWidth={900}>
      <Pressable accessibilityRole="button" onPress={() => router.navigate('/coach/sessions')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: TOUCH, alignSelf: 'flex-start' }}>
        <Icon name="back" size={22} color={c.brandText} />
        <BodyBold color={c.brandText}>Sessions</BodyBold>
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <View style={{ flex: 1, minWidth: 200 }}>
          <Title>Exercise library</Title>
          <Small>
            {st.exercises.length} exercises · {withVideo} with a video
          </Small>
        </View>
        <Button small icon="plus" title="Add an exercise" onPress={() => setAdding(true)} />
      </View>
      {adding ? (
        <ExerciseForm
          title="New exercise"
          onCancel={() => setAdding(false)}
          onSave={(e) => {
            st.addExercise(e);
            setAdding(false);
          }}
        />
      ) : null}
      <Card>
        <TextInput value={q} onChangeText={setQ} placeholder="Search your exercises" placeholderTextColor={c.muted} style={input} accessibilityLabel="Search exercises" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          <Chip label="All" on={cat === 'All'} onPress={() => setCat('All')} />
          {EXERCISE_CATEGORIES.map((x) => (
            <Chip key={x} label={x} on={cat === x} onPress={() => setCat(x)} />
          ))}
          {uncategorised ? <Chip label={`No category (${uncategorised})`} on={cat === 'None'} onPress={() => setCat('None')} /> : null}
        </View>
        {list.length === 0 ? <Body>No exercises here yet.</Body> : null}
        {list.map((e) =>
          open === e.id ? (
            <ExerciseForm
              key={e.id}
              title={`Edit ${e.name}`}
              start={e}
              onCancel={() => setOpen(null)}
              onSave={(patch) => {
                st.updateExercise(e.id, patch);
                setOpen(null);
              }}
            />
          ) : (
            <Pressable
              key={e.id}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${e.name}`}
              onPress={() => setOpen(e.id)}
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: c.line, opacity: pressed ? 0.8 : 1 })}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <BodyBold>{e.name}</BodyBold>
                <Small>{e.category ?? 'No category yet'}</Small>
              </View>
              {e.videoUrl ? <Tag label="Video" icon="film" tone="ok" /> : <Tag label="No video" tone="neutral" />}
              <Icon name="chev" size={20} color={c.muted} />
            </Pressable>
          ),
        )}
      </Card>
    </Page>
  );
}

type Draft = Pick<Exercise, 'name' | 'category' | 'videoUrl' | 'coachingNotes'>;

function ExerciseForm({ title, start, onSave, onCancel }: { title: string; start?: Exercise; onSave: (e: Draft) => void; onCancel: () => void }) {
  const { c } = useUI();
  const [name, setName] = useState(start?.name ?? '');
  const [category, setCategory] = useState<ExerciseCategory | undefined>(start?.category);
  const [video, setVideo] = useState(start?.videoUrl ?? '');
  const [notes, setNotes] = useState(start?.coachingNotes ?? '');
  const input = { minHeight: 50, borderWidth: 1.5, borderColor: c.line, borderRadius: radius.md, paddingHorizontal: 12, fontFamily: fonts.body, fontSize: 16, color: c.ink, backgroundColor: c.surface } as const;
  const url = cleanVideoUrl(video);
  return (
    <Card tone="soft">
      <H3>{title}</H3>
      <TextInput value={name} onChangeText={setName} placeholder="Exercise name, e.g. Bulgarian split squat" placeholderTextColor={c.muted} style={input} accessibilityLabel="Exercise name" />
      <Small>Category</Small>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {EXERCISE_CATEGORIES.map((x) => (
          <Chip key={x} label={x} on={category === x} onPress={() => setCategory(category === x ? undefined : x)} />
        ))}
      </View>
      <Small>Video link (optional). Upload to YouTube as "Unlisted" and paste the link here.</Small>
      <TextInput
        value={video}
        onChangeText={setVideo}
        placeholder="https://youtu.be/..."
        placeholderTextColor={c.muted}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        style={input}
        accessibilityLabel="Video link"
      />
      {url ? <Button small variant="ghost" icon="film" title="Check the link" onPress={() => Linking.openURL(url)} /> : null}
      <Small>Coaching notes (optional). Clients see these during the session.</Small>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="For example: keep the front knee over the toes"
        placeholderTextColor={c.muted}
        multiline
        style={[input, { minHeight: 80, paddingTop: 10, textAlignVertical: 'top' }]}
        accessibilityLabel="Coaching notes"
      />
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
        <Button small icon="check" title="Save" disabled={!name.trim()} onPress={() => onSave({ name: name.trim(), category, videoUrl: url, coachingNotes: notes.trim() })} />
        <Button small variant="ghost" title="Cancel" onPress={onCancel} />
      </View>
    </Card>
  );
}
