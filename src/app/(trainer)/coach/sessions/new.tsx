import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { CATEGORIES, DayPicker } from '@/components/Assign';
import { Icon } from '@/components/Icon';
import { NumbersEditor } from '@/components/NumbersEditor';
import { Body, BodyBold, Button, Card, Chip, Eyebrow, H3, Page, Small, Tag, Title, useLayout, useUI } from '@/components/ui';
import { prescription } from '@/data/format';
import { useStore } from '@/data/store';
import { addToSection, bySection, canJoin, effortLabel, EXERCISE_CATEGORIES, groupLabel, groups, KIND_LABEL, KIND_SECTIONS, SECTION_HINT, sectionLabel, sectionOf, sortBySection } from '@/data/structure';
import type { Category, ExerciseCategory, SectionId, SessionExercise, SessionKind } from '@/data/types';
import { fonts, radius, TOUCH } from '@/theme';

// Hogan builds a session part by part (warm ups, drills, main, cool down),
// sets the numbers, joins supersets and circuits, and assigns it.
// ?edit=<id> changes a session in place; ?from=<id> starts from a copy.
export default function NewSession() {
  const { from, edit, client } = useLocalSearchParams<{ from?: string; edit?: string; client?: string }>();
  const st = useStore();
  const { c } = useUI();
  const { size } = useLayout();
  const editing = st.sessions.find((x) => x.id === edit);
  const source = editing ?? st.sessions.find((x) => x.id === from);
  const [name, setName] = useState(editing ? editing.name : source ? `${source.name} (copy)` : '');
  const [category, setCategory] = useState<Category>(source?.category ?? 'Strength');
  const [programme, setProgramme] = useState(source?.programme ?? '');
  const [phase, setPhase] = useState<number | undefined>(source?.phase);
  const programmes = Array.from(new Set(st.sessions.map((x) => x.programme).filter((x): x is string => !!x))).sort();
  const [kind, setKind] = useState<SessionKind>(source?.kind ?? (source?.category === 'Cardio' ? 'cv' : 'weights'));
  const [items, setItems] = useState<SessionExercise[]>(() => sortBySection(source?.exercises.map((x) => ({ ...x })) ?? []));
  const [target, setTarget] = useState<SectionId>('main');
  const [assignTo, setAssignTo] = useState<string[]>(client ? [client] : []);
  const [days, setDays] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [libCat, setLibCat] = useState<ExerciseCategory | 'All'>('All');
  const [newCat, setNewCat] = useState<ExerciseCategory | undefined>();
  const [saved, setSaved] = useState<string | null>(null);
  // One exercise's numbers open at a time keeps a 25-exercise session readable.
  const [openRow, setOpenRow] = useState<number | null>(null);

  const sections = KIND_SECTIONS[kind];
  const g = groups(items);
  const query = q.trim().toLowerCase();
  const library = st.exercises
    .filter((e) => libCat === 'All' || e.category === libCat)
    .filter((e) => !query || e.name.toLowerCase().includes(query) || e.tags.some((t) => t.includes(query)))
    .sort((a, b) => a.name.localeCompare(b.name));
  const exact = st.exercises.some((e) => e.name.trim().toLowerCase() === query);
  const minutes = Math.max(5, Math.round(items.reduce((t, x, i) => t + x.sets * (45 + (g[i] && g[i]!.index < g[i]!.size ? 0 : x.restSec)), 0) / 60));
  const update = (i: number, patch: Partial<SessionExercise>) => setItems(items.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length || sectionOf(items[i]) !== sectionOf(items[j])) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
    if (openRow === i) setOpenRow(j);
    else if (openRow === j) setOpenRow(i);
  };
  const add = (exerciseId: string) => {
    const warm = target !== 'main';
    const x: SessionExercise = { exerciseId, section: target === 'main' ? undefined : target, sets: warm ? 1 : 3, reps: '10', restSec: warm ? 0 : 60 };
    const next = addToSection(items, x);
    setItems(next);
    setOpenRow(next.indexOf(x));
  };
  const pickTarget = (id: SectionId) => {
    setTarget(id);
    const hint = SECTION_HINT[id]?.[0];
    setLibCat(hint ?? 'All');
  };
  // A CV session has no CV warm up or finisher, so move those into the nearest part.
  const switchKind = (k: SessionKind) => {
    setKind(k);
    if (!KIND_SECTIONS[k].includes(target)) setTarget('main');
    setItems(sortBySection(items.map((x) => (KIND_SECTIONS[k].includes(sectionOf(x)) ? x : { ...x, section: sectionOf(x) === 'cv-warmup' ? 'mobility' : undefined }))));
  };
  const input = { minHeight: 50, borderWidth: 1.5, borderColor: c.line, borderRadius: radius.md, paddingHorizontal: 12, fontFamily: fonts.body, fontSize: 16, color: c.ink, backgroundColor: c.surface } as const;

  if (saved) {
    return (
      <Page maxWidth={700}>
        <Card>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Icon name="check" size={24} color={c.ok} />
            <Title>Session saved</Title>
          </View>
          <Body>
            {saved} is in your library{assignTo.length ? ` and assigned to ${assignTo.length} client${assignTo.length > 1 ? 's' : ''}. They'll see it marked "New from Hogan".` : '.'}
          </Body>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            <Button small title="Back to sessions" onPress={() => router.navigate('/coach/sessions')} />
            {editing ? null : (
              <Button
                small
                variant="ghost"
                title="Build another"
                onPress={() => {
                  setSaved(null);
                  setName('');
                  setItems([]);
                  setAssignTo([]);
                  setDays([]);
                }}
              />
            )}
          </View>
        </Card>
      </Page>
    );
  }

  const row = (x: SessionExercise, i: number) => {
    const e = st.exercises.find((y) => y.id === x.exerciseId);
    const info = g[i];
    const joinable = canJoin(items, i);
    const midGroup = info && info.index < info.size;
    const open = openRow === i;
    const rest = midGroup ? 0 : x.restSec;
    const summary = [prescription(x), x.tempo ? `tempo ${x.tempo}` : null, effortLabel(x), x.dropSet ? 'drop set' : null, rest ? `rest ${rest}s` : 'no rest'].filter(Boolean).join(' · ');
    return (
      <View key={i} style={{ gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.line }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontFamily: fonts.heavy, color: c.brandText, fontSize: 16, minWidth: 26 }}>{info ? `${info.letter}${info.index}` : i + 1}</Text>
          <View style={{ flex: 1, gap: 2 }}>
            <BodyBold>{e?.name ?? 'Exercise'}</BodyBold>
            <Small>
              {info ? `${groupLabel(info)} · ` : ''}
              {summary}
            </Small>
          </View>
          <Button small variant={open ? 'primary' : 'ghost'} title={open ? 'Done' : 'Edit'} onPress={() => setOpenRow(open ? null : i)} />
          <Pressable accessibilityRole="button" accessibilityLabel="Move up" onPress={() => move(i, -1)} style={{ minWidth: 36, minHeight: TOUCH, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ transform: [{ rotate: '-90deg' }] }}>
              <Icon name="chev" size={20} color={c.muted} />
            </View>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Move down" onPress={() => move(i, 1)} style={{ minWidth: 36, minHeight: TOUCH, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ transform: [{ rotate: '90deg' }] }}>
              <Icon name="chev" size={20} color={c.muted} />
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove ${e?.name ?? 'exercise'}`}
            onPress={() => {
              setItems(items.filter((_, j) => j !== i));
              setOpenRow(null);
            }}
            style={{ minWidth: 36, minHeight: TOUCH, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="x" size={20} color={c.muted} />
          </Pressable>
        </View>
        {open ? (
          <NumbersEditor
            x={x}
            name={e?.name ?? 'this exercise'}
            onChange={(patch) => update(i, patch)}
            restNote={midGroup ? `No rest after this one: go straight to the next exercise in the ${info!.kind}.` : undefined}
          />
        ) : null}
        {joinable ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <Small>Join to the next exercise</Small>
            <Chip label="Superset" on={x.join === 'superset'} onPress={() => update(i, { join: x.join === 'superset' ? undefined : 'superset' })} />
            <Chip label="Circuit" on={x.join === 'circuit'} onPress={() => update(i, { join: x.join === 'circuit' ? undefined : 'circuit' })} />
          </View>
        ) : null}
      </View>
    );
  };

  const builder = (
    <View style={{ gap: 16 }}>
      <Card>
        <H3>Session details</H3>
        <TextInput value={name} onChangeText={setName} placeholder="Session name, e.g. Lower body week 1" placeholderTextColor={c.muted} style={input} accessibilityLabel="Session name" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(['weights', 'cv'] as SessionKind[]).map((k) => (
            <Chip key={k} label={KIND_LABEL[k]} on={kind === k} onPress={() => switchKind(k)} />
          ))}
        </View>
        <Small>Shows in the client's list under</Small>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CATEGORIES.map((cat) => (
            <Chip key={cat} label={cat} on={category === cat} onPress={() => setCategory(cat)} />
          ))}
        </View>
        <Small>Part of a phased programme? (optional)</Small>
        <TextInput value={programme} onChangeText={setProgramme} placeholder="Programme name, e.g. Shoulder mobility" placeholderTextColor={c.muted} style={input} accessibilityLabel="Programme name" />
        {programmes.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {programmes.map((p) => (
              <Chip key={p} label={p} on={programme.trim() === p} onPress={() => setProgramme(programme.trim() === p ? '' : p)} />
            ))}
          </View>
        ) : null}
        {programme.trim() ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <Small>Phase</Small>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <Chip key={n} label={String(n)} on={phase === n} onPress={() => setPhase(phase === n ? undefined : n)} />
            ))}
          </View>
        ) : null}
        {editing ? <Small>Clients you've given their own numbers for this session keep those numbers. Everyone else sees the changes.</Small> : null}
      </Card>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <H3>Exercises</H3>
          <Small>About {minutes} min</Small>
        </View>
        {items.length === 0 ? <Body>Pick a part below, then tap exercises in your library to add them. Leave out any part this client doesn't do.</Body> : null}
        {bySection(items).map((part) => (
          <View key={part.id} style={{ gap: 4 }}>
            <Eyebrow color={c.brandText}>{sectionLabel(part.id, kind)}</Eyebrow>
            {part.rows.map(({ x, i }) => row(x, i))}
          </View>
        ))}
      </Card>
      {items.length === 0 && !editing ? (
        <Card tone="soft">
          <H3>Start from one of your sessions</H3>
          <Small>Copies its exercises and numbers in, then change whatever you like.</Small>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {st.sessions.map((x) => (
              <Chip
                key={x.id}
                label={x.name}
                onPress={() => {
                  setItems(sortBySection(x.exercises.map((y) => ({ ...y }))));
                  setCategory(x.category);
                  if (x.kind) setKind(x.kind);
                  if (!name.trim()) setName(`${x.name} (copy)`);
                }}
              />
            ))}
          </View>
        </Card>
      ) : null}
      {editing ? null : (
        <Card>
          <H3>Assign to (optional)</H3>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {st.clients
              .filter((x) => x.invite === 'joined')
              .map((x) => (
                <Chip
                  key={x.id}
                  label={`${x.firstName} ${x.lastName[0] ?? ''}.`}
                  on={assignTo.includes(x.id)}
                  onPress={() => setAssignTo(assignTo.includes(x.id) ? assignTo.filter((y) => y !== x.id) : [...assignTo, x.id])}
                />
              ))}
          </View>
          {assignTo.length ? (
            <>
              <Small>On which days?</Small>
              <DayPicker days={days} onChange={setDays} />
            </>
          ) : null}
        </Card>
      )}
      <Button
        full
        icon="check"
        title={name.trim() && items.length ? (editing ? 'Save changes' : 'Save session') : 'Add a name and at least one exercise'}
        disabled={!name.trim() || items.length === 0}
        onPress={() => {
          const body = {
            name: name.trim(),
            category,
            kind,
            minutes,
            equipment: source?.equipment ?? 'See exercises',
            level: source?.level ?? 1,
            purpose: source?.purpose ?? `${KIND_LABEL[kind]} from Hogan.`,
            safetyNote: source?.safetyNote,
            programme: programme.trim() || undefined,
            phase: programme.trim() ? phase : undefined,
            exercises: items,
          };
          if (editing) st.updateSession(editing.id, body);
          else st.saveSession(body, assignTo, days);
          setSaved(name.trim());
        }}
      />
    </View>
  );

  const lib = (
    <Card>
      <H3>Your exercise library</H3>
      <Small>Adding to</Small>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {sections.map((id) => (
          <Chip key={id} label={sectionLabel(id, kind)} on={target === id} onPress={() => pickTarget(id)} />
        ))}
      </View>
      <TextInput value={q} onChangeText={setQ} placeholder="Search or type a new exercise" placeholderTextColor={c.muted} style={input} accessibilityLabel="Search exercises" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {(['All', ...EXERCISE_CATEGORIES] as const).map((cat) => (
          <Chip key={cat} label={cat} on={libCat === cat} onPress={() => setLibCat(cat)} />
        ))}
      </View>
      {query && !exact ? (
        <Card tone="soft" style={{ padding: 12, gap: 8 }}>
          <BodyBold>Add "{q.trim()}" to your library</BodyBold>
          <Small>Pick a category. You can add the video link later from the library.</Small>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {EXERCISE_CATEGORIES.map((cat) => (
              <Chip key={cat} label={cat} on={(newCat ?? (libCat === 'All' ? undefined : libCat)) === cat} onPress={() => setNewCat(cat)} />
            ))}
          </View>
          <Button
            small
            icon="plus"
            title={`Add it to ${sectionLabel(target, kind).toLowerCase()}`}
            onPress={() => {
              const e = st.addExercise({ name: q.trim().replace(/^./, (ch) => ch.toUpperCase()), category: newCat ?? (libCat === 'All' ? undefined : libCat), coachingNotes: '' });
              add(e.id);
              setQ('');
              setNewCat(undefined);
            }}
          />
        </Card>
      ) : null}
      {library.length === 0 && !query ? <Small>Nothing in this category yet. Type a name above to add one.</Small> : null}
      {library.map((e) => (
        <Pressable
          key={e.id}
          accessibilityRole="button"
          accessibilityLabel={`Add ${e.name}`}
          onPress={() => add(e.id)}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: c.line, opacity: pressed ? 0.8 : 1 })}
        >
          <View style={{ flex: 1 }}>
            <BodyBold>{e.name}</BodyBold>
            <Small>{[e.category, e.videoUrl ? 'Video' : null].filter(Boolean).join(' · ') || e.tags.join(' · ')}</Small>
          </View>
          <Icon name="plus" size={22} color={c.brandText} />
        </Pressable>
      ))}
    </Card>
  );

  return (
    <Page>
      <Pressable accessibilityRole="button" onPress={() => router.navigate('/coach/sessions')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: TOUCH, alignSelf: 'flex-start' }}>
        <Icon name="back" size={22} color={c.brandText} />
        <BodyBold color={c.brandText}>Sessions</BodyBold>
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Title>{editing ? `Edit ${editing.name}` : 'Build a session'}</Title>
        <Tag label={KIND_LABEL[kind]} tone="neutral" icon={kind === 'cv' ? 'heart' : 'dumbbell'} />
      </View>
      {size === 'compact' ? (
        <View style={{ gap: 16 }}>
          {builder}
          {lib}
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 20, alignItems: 'flex-start' }}>
          <View style={{ flex: 1.3 }}>{builder}</View>
          <View style={{ flex: 1 }}>{lib}</View>
        </View>
      )}
    </Page>
  );
}
