import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Body, BodyBold, Button, Card, Chip, Small, Title, useUI } from '@/components/ui';
import { useMe, useStore } from '@/data/store';
import type { WeeklyAnswer } from '@/data/types';
import { WEEKLY_INTRO, WEEKLY_QUESTIONS, WEEKLY_TITLE, type WeeklyQuestion } from '@/data/weekly';
import { fonts, radius, TOUCH } from '@/theme';

// The weekly check-in form. Questions come from src/data/weekly.ts.

const todayLabel = () => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
export default function Weekly() {
  const st = useStore();
  const me = useMe();
  const { c } = useUI();
  const insets = useSafeAreaInsets();
  const [answers, setAnswers] = useState<Record<string, string | number>>(() => ({ name: `${me.firstName} ${me.lastName}`, date: todayLabel() }));
  const [sent, setSent] = useState(false);

  useEffect(() => {
    st.setRole('client');
  }, [st.setRole]);

  const set = (id: string, v: string | number) => setAnswers({ ...answers, [id]: v });
  const required = WEEKLY_QUESTIONS.filter((q) => q.required);
  const missing = required.filter((q) => answers[q.id] === undefined || answers[q.id] === '').length;

  if (sent) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={{ maxWidth: 520, width: '100%', gap: 18, alignItems: 'center' }}>
          <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: c.brand, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={44} color={c.brandInk} strokeWidth={2.6} />
          </View>
          <Title center>Weekly check-in sent</Title>
          <Body center>Thanks {me.firstName}. Hogan will look through it and adjust next week's plan if he needs to.</Body>
          <Button title="Back to Today" icon="home" onPress={() => router.replace('/')} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 18, paddingBottom: 12, backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.line, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Do this later" onPress={() => (router.canGoBack() ? router.back() : router.navigate('/'))} style={{ minWidth: TOUCH, minHeight: TOUCH, justifyContent: 'center' }}>
          <Icon name="x" size={26} color={c.ink} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <BodyBold>Weekly check-in</BodyBold>
          <Small>About 3 minutes</Small>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + 30 }}>
        <View style={{ width: '100%', maxWidth: 680, alignSelf: 'center', gap: 16 }}>
          <Card>
            <BodyBold>{WEEKLY_TITLE}</BodyBold>
            <Body>{WEEKLY_INTRO}</Body>
          </Card>
          {WEEKLY_QUESTIONS.map((q, n) => (
            <Card key={q.id}>
              <Small>
                {n + 1} of {WEEKLY_QUESTIONS.length}
              </Small>
              <BodyBold>
                {q.label}
                {q.required ? <Text style={{ color: c.bad }}> *</Text> : null}
              </BodyBold>
              <Answer q={q} value={answers[q.id]} onChange={(v) => set(q.id, v)} />
            </Card>
          ))}
          <Button
            full
            icon="send"
            title={missing ? `${missing} more to answer` : 'Send to Hogan'}
            disabled={missing > 0}
            onPress={() => {
              const list: WeeklyAnswer[] = WEEKLY_QUESTIONS.filter((q) => answers[q.id] !== undefined && answers[q.id] !== '').map((q) => ({
                questionId: q.id,
                value: q.kind === 'number' ? Number(answers[q.id]) : answers[q.id],
              }));
              st.submitWeekly(list);
              setSent(true);
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function Answer({ q, value, onChange }: { q: WeeklyQuestion; value: string | number | undefined; onChange: (v: string | number) => void }) {
  const { c, k } = useUI();
  const input = { minHeight: 52, borderWidth: 1.5, borderColor: c.line, borderRadius: radius.md, paddingHorizontal: 12, fontFamily: fonts.body, fontSize: 17, color: c.ink, backgroundColor: c.surface } as const;
  if (q.kind === 'scale') {
    return (
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {Array.from({ length: q.max }, (_, i) => i + 1).map((n) => {
            const on = value === n;
            return (
              <Pressable
                key={n}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${n} out of ${q.max}`}
                onPress={() => onChange(n)}
                style={{ flexBasis: '17%', flexGrow: 1, minHeight: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.brand : c.surface2 }}
              >
                <Text style={{ fontFamily: fonts.heavy, fontSize: Math.round(18 * k), color: on ? c.brandInk : c.ink }}>{n}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
          <Small>1 · {q.low}</Small>
          <Small style={{ textAlign: 'right' }}>
            {q.max} · {q.high}
          </Small>
        </View>
      </View>
    );
  }
  if (q.kind === 'choice') {
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {q.options.map((o) => (
          <Chip key={o} label={o} on={value === o} onPress={() => onChange(o)} />
        ))}
      </View>
    );
  }
  if (q.kind === 'number') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <TextInput
          value={value === undefined ? '' : String(value)}
          onChangeText={(t) => onChange(t.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
          placeholder="0.0"
          placeholderTextColor={c.muted}
          accessibilityLabel={q.label}
          style={[input, { width: 130, fontFamily: fonts.bold, fontSize: 20 }]}
        />
        <BodyBold>{q.unit}</BodyBold>
      </View>
    );
  }
  if (q.kind === 'short' || q.kind === 'date') {
    return (
      <TextInput
        value={value === undefined ? '' : String(value)}
        onChangeText={onChange}
        placeholder={q.kind === 'date' ? 'DD/MM/YYYY' : 'Your answer'}
        placeholderTextColor={c.muted}
        keyboardType={q.kind === 'date' ? 'numbers-and-punctuation' : 'default'}
        autoCapitalize={q.kind === 'short' ? 'words' : 'none'}
        accessibilityLabel={q.label}
        style={input}
      />
    );
  }
  return (
    <TextInput
      value={value === undefined ? '' : String(value)}
      onChangeText={onChange}
      multiline
      placeholder={q.placeholder}
      placeholderTextColor={c.muted}
      accessibilityLabel={q.label}
      style={[input, { minHeight: 80, paddingTop: 12, textAlignVertical: 'top' }]}
    />
  );
}
