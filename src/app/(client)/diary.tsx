import { router } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { FeelRow, MobileTopBar, ReplyBubble, useHardList } from '@/components/ClientBits';
import { Icon } from '@/components/Icon';
import { Body, BodyBold, Button, Card, Eyebrow, H3, Page, Small, Tag, Title, useLayout, useUI, VoiceNote } from '@/components/ui';
import { monthName } from '@/data/sample';
import { useClientData } from '@/data/selectors';
import { useLookups, useMe, useStore } from '@/data/store';
import type { DiaryEntry, SessionLog } from '@/data/types';
import { fonts, radius } from '@/theme';

type Item = { kind: 'log'; log: SessionLog; sort: number } | { kind: 'note'; entry: DiaryEntry; sort: number };

export default function Diary() {
  const me = useMe();
  const st = useStore();
  const d = useClientData(me.id);
  const { size } = useLayout();
  const { c, k } = useUI();
  const [draft, setDraft] = useState('');
  const [saved, setSaved] = useState(false);

  const items: Item[] = [
    ...d.logs.map((log) => ({ kind: 'log' as const, log, sort: log.minutesAgo })),
    ...d.diary.map((entry) => ({ kind: 'note' as const, entry, sort: Math.round((Date.now() - new Date(entry.date + 'T08:00:00').getTime()) / 60000) })),
  ].sort((a, b) => a.sort - b.sort);

  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  const doneDays = new Set(d.logs.map((l) => l.date));
  const noteDays = new Set(d.diary.map((e) => e.date));
  const iso = (day: number) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const monthCount = Array.from({ length: daysInMonth }, (_, i) => iso(i + 1)).filter((x) => doneDays.has(x)).length;

  const calendar = (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <H3>
          {monthName(now)} {now.getFullYear()}
        </H3>
        <Small>{monthCount} sessions</Small>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((x, i) => (
          <View key={'h' + i} style={{ width: `${100 / 7}%`, alignItems: 'center', paddingBottom: 4 }}>
            <Text style={{ fontFamily: fonts.heavy, fontSize: 12, color: c.muted }}>{x}</Text>
          </View>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <View key={'o' + i} style={{ width: `${100 / 7}%` }} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const done = doneDays.has(iso(day));
          const today = day === now.getDate();
          return (
            <View key={day} style={{ width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? c.brand : 'transparent', borderWidth: today && !done ? 2.5 : 0, borderColor: c.brand }}>
                <Text style={{ fontFamily: done || today ? fonts.heavy : fonts.medium, fontSize: 14, color: done ? c.brandInk : c.ink }}>{day}</Text>
                {noteDays.has(iso(day)) ? <View style={{ position: 'absolute', bottom: 2, width: 5, height: 5, borderRadius: 3, backgroundColor: c.warn }} /> : null}
              </View>
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap' }}>
        <Small>● Done</Small>
        <Small color={c.warn}>● Diary note</Small>
      </View>
    </Card>
  );

  const addNote = (
    <Card>
      <H3>Add a diary note</H3>
      <Small>Anything Hogan should know, like a walk, a stiff knee or a good night's sleep. He sees it straight away.</Small>
      <TextInput
        value={draft}
        onChangeText={(t) => {
          setDraft(t);
          setSaved(false);
        }}
        multiline
        placeholder="For example: Walked 5 km, knee stiff this morning"
        placeholderTextColor={c.muted}
        accessibilityLabel="Diary note"
        style={{ minHeight: 96, borderWidth: 1.5, borderColor: c.line, borderRadius: radius.md, padding: 12, fontFamily: fonts.body, fontSize: Math.round(17 * k), color: c.ink, textAlignVertical: 'top' }}
      />
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
        <Button
          small
          icon="check"
          title="Save note"
          disabled={!draft.trim()}
          onPress={() => {
            st.addDiary(draft.trim());
            setDraft('');
            setSaved(true);
          }}
        />
        <Button small variant="ghost" icon="mic" title="Record a voice note" />
      </View>
      {saved ? <Tag label="Saved and shared with Hogan" tone="ok" icon="check" /> : null}
    </Card>
  );

  const list = (
    <View style={{ gap: 14 }}>
      {items.map((it) => (it.kind === 'log' ? <LogEntry key={it.log.id} log={it.log} /> : <NoteEntry key={it.entry.id} entry={it.entry} />))}
    </View>
  );

  return (
    <Page>
      <MobileTopBar initials={me.initials} />
      <View style={{ gap: 4 }}>
        <Title>My diary</Title>
        <Small>Everything here is shared with Hogan</Small>
      </View>
      {size === 'compact' ? (
        <View style={{ gap: 16 }}>
          {addNote}
          {calendar}
          {list}
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 20, alignItems: 'flex-start' }}>
          <View style={{ width: size === 'wide' ? 380 : 330, gap: 18 }}>
            {calendar}
            {addNote}
          </View>
          <View style={{ flex: 1 }}>{list}</View>
        </View>
      )}
    </Page>
  );
}

function LogEntry({ log }: { log: SessionLog }) {
  const { session, repliesFor } = useLookups();
  const hard = useHardList(log);
  const s = session(log.sessionId);
  return (
    <Card>
      <Eyebrow>{log.dateLabel}</Eyebrow>
      <H3>{s.name}</H3>
      <FeelRow log={log} />
      {log.checkIn?.voiceNote ? <VoiceNote {...log.checkIn.voiceNote} /> : null}
      {log.checkIn?.enjoyed ? <Body>{log.checkIn.enjoyed}</Body> : null}
      {log.checkIn?.hardNote ? <Body>{log.checkIn.hardNote}</Body> : null}
      {log.checkIn?.forTrainer ? <Body>{log.checkIn.forTrainer}</Body> : null}
      {hard.length ? <Tag label={`Found hard: ${hard.join(', ')}`} tone="warn" /> : null}
      {!log.checkIn ? <Button small variant="warn" title="Check in now" onPress={() => router.navigate(`/checkin/${log.id}`)} /> : null}
      {repliesFor(log.id).map((r) => (
        <ReplyBubble key={r.id} text={r.text} at={r.at} />
      ))}
    </Card>
  );
}

function NoteEntry({ entry }: { entry: DiaryEntry }) {
  const { c } = useUI();
  const { repliesFor } = useLookups();
  return (
    <Card>
      <Eyebrow>{entry.dateLabel}</Eyebrow>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <Icon name="book" size={20} color={c.warn} />
        <BodyBold>Diary note</BodyBold>
      </View>
      <Body>{entry.text}</Body>
      {repliesFor(entry.id).map((r) => (
        <ReplyBubble key={r.id} text={r.text} at={r.at} />
      ))}
    </Card>
  );
}
