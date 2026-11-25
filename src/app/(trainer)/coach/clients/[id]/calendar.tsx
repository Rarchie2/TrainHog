import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { daysLabel } from '@/components/Assign';
import { DeloadPanel } from '@/components/DeloadPanel';
import { Icon } from '@/components/Icon';
import { Body, BodyBold, Button, Card, Chip, H3, Page, Small, Tag, Title, useLayout, useUI } from '@/components/ui';
import { deloadFor, deloadShort } from '@/data/deload';
import { isoDate, longDate, monthName } from '@/data/sample';
import { dayItems, isMissed, startOfWeek } from '@/data/selectors';
import { useStore } from '@/data/store';
import { fonts, radius, TOUCH } from '@/theme';

const HEAD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const AHEAD = 8; // weeks shown in the plan-ahead strip

// Hogan's calendar for one client: tap a day, add sessions to it, and copy a
// week forward to build out a block. Week view by default (step a week at a
// time, with the next 8 weeks at a glance); month view for the bigger picture.
// Missed days get a red marker. Deload weeks are shaded, and the deload panel
// under the day sets what changes. Clients only ever see the current week.
export default function ClientCalendar() {
  const { id, week } = useLocalSearchParams<{ id: string; week?: string }>();
  const st = useStore();
  const { c } = useUI();
  const { size } = useLayout();
  const who = st.clients.find((x) => x.id === id);
  const todayIso = isoDate(new Date());
  const thisMonday = isoDate(startOfWeek());
  const opened = week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? week : todayIso;
  const [view, setView] = useState<'week' | 'month'>('week');
  const [month, setMonth] = useState(() => {
    const d = new Date(opened + 'T12:00:00');
    return new Date(d.getFullYear(), d.getMonth(), 1, 12);
  });
  const [selected, setSelected] = useState(opened);
  const [q, setQ] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  if (!who) return <Page><Body>Client not found.</Body></Page>;

  // Six rows of Monday-to-Sunday weeks covering the month.
  const first = startOfWeek(month);
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(first);
    d.setDate(first.getDate() + i);
    return d;
  }).filter((d, i) => i < 35 || d.getMonth() === month.getMonth());
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1, 12));

  const sel = new Date(selected + 'T12:00:00');
  const items = dayItems(st, who.id, selected);
  const query = q.trim().toLowerCase();
  const library = st.sessions.filter((s) => !query || s.name.toLowerCase().includes(query)).sort((a, b) => a.name.localeCompare(b.name));
  const weekStart = isoDate(startOfWeek(sel));
  const weekDated = st.planned.filter((p) => {
    if (p.clientId !== who.id) return false;
    const diff = (new Date(p.date + 'T12:00:00').getTime() - new Date(weekStart + 'T12:00:00').getTime()) / 86400000;
    return diff >= 0 && diff < 7;
  }).length;
  const input = { minHeight: 50, borderWidth: 1.5, borderColor: c.line, borderRadius: radius.md, paddingHorizontal: 12, fontFamily: fonts.body, fontSize: 16, color: c.ink, backgroundColor: c.surface } as const;
  const cell = size === 'compact' ? 48 : 92;

  // Week view: move the selected day a week at a time.
  const plusDays = (iso: string, n: number) => {
    const d = new Date(iso + 'T12:00:00');
    d.setDate(d.getDate() + n);
    return isoDate(d);
  };
  const shiftWeek = (n: number) => {
    const next = plusDays(selected, 7 * n);
    setSelected(next);
    setMonth(new Date(new Date(next + 'T12:00:00').getFullYear(), new Date(next + 'T12:00:00').getMonth(), 1, 12));
    setCopied(null);
  };
  const weeksAway = Math.round((new Date(weekStart + 'T12:00:00').getTime() - new Date(thisMonday + 'T12:00:00').getTime()) / (7 * 86400000));
  const weekLabel = weeksAway === 0 ? 'This week' : weeksAway === 1 ? 'Next week' : weeksAway === -1 ? 'Last week' : weeksAway > 0 ? `In ${weeksAway} weeks` : `${-weeksAway} weeks ago`;
  const shortDate = (iso: string) => {
    const d = new Date(iso + 'T12:00:00');
    return `${d.getDate()} ${monthName(d).slice(0, 3)}`;
  };
  const thisDeload = deloadFor(who, weekStart);
  const weekDays = Array.from({ length: 7 }, (_, i) => plusDays(weekStart, i));
  const ahead = Array.from({ length: AHEAD }, (_, i) => {
    const monday = plusDays(thisMonday, 7 * i);
    const count = Array.from({ length: 7 }, (_, j) => dayItems(st, who.id, plusDays(monday, j)).length).reduce((a, b) => a + b, 0);
    return { monday, count, deload: deloadFor(who, monday) };
  });

  const viewSwitch = (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Chip label="Week" icon="list" on={view === 'week'} onPress={() => setView('week')} />
      <Chip
        label="Month"
        icon="cal"
        on={view === 'month'}
        onPress={() => {
          setMonth(new Date(sel.getFullYear(), sel.getMonth(), 1, 12));
          setView('month');
        }}
      />
    </View>
  );

  const weekGrid = (
    <Card>
      {viewSwitch}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous week" onPress={() => shiftWeek(-1)} style={{ minWidth: TOUCH, minHeight: TOUCH, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="back" size={22} color={c.brandText} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <H3 style={{ textAlign: 'center' }}>
            {shortDate(weekStart)} to {shortDate(plusDays(weekStart, 6))}
          </H3>
          <Small>{weekLabel}</Small>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Next week" onPress={() => shiftWeek(1)} style={{ minWidth: TOUCH, minHeight: TOUCH, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chev" size={22} color={c.brandText} />
        </Pressable>
      </View>
      {weeksAway !== 0 ? (
        <Pressable accessibilityRole="button" onPress={() => setSelected(todayIso)} style={{ alignSelf: 'center', minHeight: 36, justifyContent: 'center' }}>
          <BodyBold color={c.brandText}>Back to this week</BodyBold>
        </Pressable>
      ) : null}
      {thisDeload ? <Tag label={thisDeload.changes.length ? `Deload week: ${deloadShort(thisDeload)}` : 'Deload week'} tone="warn" /> : null}
      <View>
        {weekDays.map((iso, n) => {
          const d = new Date(iso + 'T12:00:00');
          const its = dayItems(st, who.id, iso);
          const missed = isMissed(its, iso);
          const on = iso === selected;
          return (
            <Pressable
              key={iso}
              accessibilityRole="button"
              accessibilityLabel={`${longDate(d)}, ${its.length} session${its.length === 1 ? '' : 's'}${missed ? ', missed' : ''}`}
              onPress={() => setSelected(iso)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                minHeight: 52,
                paddingHorizontal: 8,
                paddingVertical: 6,
                borderRadius: 10,
                borderWidth: on ? 2 : 0,
                borderColor: c.brand,
                borderTopWidth: on ? 2 : n ? 1 : 0,
                borderTopColor: on ? c.brand : c.line,
                backgroundColor: iso === todayIso ? c.brandSoft : 'transparent',
              }}
            >
              <View style={{ width: 44 }}>
                <Small style={{ fontFamily: fonts.bold }}>{HEAD[n]}</Small>
                <BodyBold>{d.getDate()}</BodyBold>
              </View>
              <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {its.length === 0 ? <Small>Rest</Small> : null}
                {its.map((x, k) => (
                  <Text key={k} numberOfLines={1} style={{ fontFamily: fonts.medium, fontSize: 13, color: x.done ? c.ok : c.ink, backgroundColor: x.planned ? c.brandSoft : c.surface2, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, overflow: 'hidden' }}>
                    {x.session.name}
                  </Text>
                ))}
              </View>
              {missed ? <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: c.bad }} /> : its.length && its.every((x) => x.done) ? <Icon name="check" size={16} color={c.ok} /> : null}
            </Pressable>
          );
        })}
      </View>
      <View style={{ gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: c.line }}>
        <BodyBold>Next {AHEAD} weeks</BodyBold>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {ahead.map((w, i) => {
            const on = w.monday === weekStart;
            return (
              <Pressable
                key={w.monday}
                accessibilityRole="button"
                accessibilityLabel={`Week of ${shortDate(w.monday)}, ${w.count} session${w.count === 1 ? '' : 's'}${w.deload ? ', deload week' : ''}`}
                onPress={() => {
                  setSelected(w.monday);
                  setCopied(null);
                }}
                style={{ minWidth: 76, flexGrow: 1, flexBasis: '22%', minHeight: TOUCH, padding: 8, borderRadius: 10, borderWidth: on ? 2 : 1, borderColor: on ? c.brand : c.line, backgroundColor: w.deload ? c.warnSoft : c.surface, gap: 2 }}
              >
                <Small style={{ fontFamily: fonts.bold }}>{i === 0 ? 'This week' : shortDate(w.monday)}</Small>
                <Small color={w.count ? c.ink : c.muted}>{w.count ? `${w.count} session${w.count === 1 ? '' : 's'}` : 'Empty'}</Small>
                {w.deload ? <Text style={{ fontSize: 11, color: c.warn, fontFamily: fonts.bold }}>Deload</Text> : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </Card>
  );

  const grid = (
    <Card>
      {viewSwitch}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => shift(-1)} style={{ minWidth: TOUCH, minHeight: TOUCH, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="back" size={22} color={c.brandText} />
        </Pressable>
        <H3 style={{ flex: 1, textAlign: 'center' }}>
          {monthName(month)} {month.getFullYear()}
        </H3>
        <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => shift(1)} style={{ minWidth: TOUCH, minHeight: TOUCH, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chev" size={22} color={c.brandText} />
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row' }}>
        {HEAD.map((h) => (
          <Text key={h} style={{ flex: 1, textAlign: 'center', fontFamily: fonts.bold, color: c.muted, fontSize: 13 }}>
            {size === 'compact' ? h[0] : h}
          </Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {days.map((d) => {
          const iso = isoDate(d);
          const its = dayItems(st, who.id, iso);
          const missed = isMissed(its, iso);
          const allDone = its.length > 0 && its.every((x) => x.done);
          const inMonth = d.getMonth() === month.getMonth();
          const on = iso === selected;
          const deload = !!deloadFor(who, isoDate(startOfWeek(d)));
          return (
            <Pressable
              key={iso}
              accessibilityRole="button"
              accessibilityLabel={`${longDate(d)}, ${its.length} session${its.length === 1 ? '' : 's'}${missed ? ', missed' : allDone ? ', done' : ''}`}
              onPress={() => setSelected(iso)}
              style={{ width: `${100 / 7}%`, minHeight: cell, padding: 3 }}
            >
              <View
                style={{
                  flex: 1,
                  borderRadius: 10,
                  padding: 5,
                  gap: 3,
                  borderWidth: on ? 2 : 1,
                  borderColor: on ? c.brand : missed ? c.bad : c.line,
                  backgroundColor: iso === todayIso ? c.brandSoft : deload ? c.warnSoft : c.surface,
                  opacity: inMonth ? 1 : 0.45,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Text style={{ fontFamily: iso === todayIso ? fonts.heavy : fonts.semibold, fontSize: 13, color: c.ink, flex: 1 }}>{d.getDate()}</Text>
                  {missed ? <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: c.bad }} /> : allDone ? <Icon name="check" size={13} color={c.ok} /> : null}
                </View>
                {size === 'compact' ? (
                  its.length ? (
                    <View style={{ flexDirection: 'row', gap: 2, flexWrap: 'wrap' }}>
                      {its.slice(0, 3).map((x, n) => (
                        <View key={n} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: x.done ? c.ok : c.brand }} />
                      ))}
                    </View>
                  ) : null
                ) : (
                  its.slice(0, 2).map((x, n) => (
                    <Text key={n} numberOfLines={1} style={{ fontFamily: fonts.medium, fontSize: 11.5, color: x.done ? c.ok : c.ink, backgroundColor: x.planned ? c.brandSoft : c.surface2, borderRadius: 4, paddingHorizontal: 3 }}>
                      {x.session.name}
                    </Text>
                  ))
                )}
                {deload && d.getDay() === 1 && size !== 'compact' ? <Text style={{ fontSize: 11, color: c.warn, fontFamily: fonts.bold }}>Deload</Text> : null}
                {size !== 'compact' && its.length > 2 ? <Text style={{ fontSize: 11, color: c.muted, fontFamily: fonts.medium }}>+{its.length - 2} more</Text> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: c.bad }} />
          <Small>Missed</Small>
        </View>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <Icon name="check" size={13} color={c.ok} />
          <Small>Done</Small>
        </View>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: c.warnSoft, borderWidth: 1, borderColor: c.line }} />
          <Small>Deload week</Small>
        </View>
      </View>
    </Card>
  );

  const day = (
    <View style={{ gap: 16 }}>
      <Card>
        <H3>{longDate(sel)}</H3>
        {items.length === 0 ? <Body>Nothing on this day yet. Add a session below.</Body> : null}
        {items.map((x, n) => (
          <View key={n} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, borderTopWidth: n ? 1 : 0, borderTopColor: c.line }}>
            <View style={{ flex: 1 }}>
              <BodyBold>{x.session.name}</BodyBold>
              <Small>{x.planned ? 'On this date' : `Weekly: ${daysLabel(x.assignment!.days)}`}</Small>
            </View>
            {x.done ? <Tag label="Done" tone="ok" icon="check" /> : selected < todayIso ? <Tag label="Missed" tone="danger" /> : null}
            {x.planned && !x.done ? (
              <Pressable accessibilityRole="button" accessibilityLabel={`Take ${x.session.name} off this day`} onPress={() => st.unplan(x.planned!.id)} style={{ minWidth: TOUCH, minHeight: TOUCH, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="x" size={20} color={c.muted} />
              </Pressable>
            ) : null}
          </View>
        ))}
        <DeloadPanel who={who} monday={weekStart} onMove={shiftWeek} />
        {weekDated ? (
          <View style={{ gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: c.line }}>
            <Small>
              Repeat this week's {weekDated} session{weekDated === 1 ? '' : 's'} (put on dates) for the next
            </Small>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {[1, 3, 7, 11].map((n) => (
                <Chip
                  key={n}
                  label={n === 1 ? '1 week' : `${n} weeks`}
                  onPress={() => {
                    const added = st.copyWeek(who.id, weekStart, n);
                    setCopied(added ? `Added ${added} session${added === 1 ? '' : 's'} over the next ${n === 1 ? 'week' : `${n} weeks`}.` : 'Those weeks already have these sessions.');
                  }}
                />
              ))}
            </View>
            {copied ? <Tag label={copied} tone="ok" icon="check" /> : null}
          </View>
        ) : null}
      </Card>
      <Card>
        <H3>Add a session to {sel.toLocaleDateString('en-GB', { weekday: 'long' })}</H3>
        <TextInput value={q} onChangeText={setQ} placeholder="Search your sessions" placeholderTextColor={c.muted} style={input} accessibilityLabel="Search sessions" />
        {library.slice(0, query ? 50 : 12).map((s) => (
          <Pressable
            key={s.id}
            accessibilityRole="button"
            accessibilityLabel={`Add ${s.name}`}
            onPress={() => {
              st.planSession(who.id, s.id, selected);
              setCopied(null);
            }}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, borderTopWidth: 1, borderTopColor: c.line, opacity: pressed ? 0.8 : 1 })}
          >
            <View style={{ flex: 1 }}>
              <BodyBold>{s.name}</BodyBold>
              <Small>
                {s.category} · {s.minutes} min
              </Small>
            </View>
            <Icon name="plus" size={22} color={c.brandText} />
          </Pressable>
        ))}
        {!query && library.length > 12 ? <Small>Search to see all {library.length} sessions.</Small> : null}
      </Card>
    </View>
  );

  return (
    <Page>
      <Pressable accessibilityRole="button" onPress={() => router.navigate(`/coach/clients/${who.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: TOUCH, alignSelf: 'flex-start' }}>
        <Icon name="back" size={22} color={c.brandText} />
        <BodyBold color={c.brandText}>{who.firstName}</BodyBold>
      </Pressable>
      <View style={{ gap: 4 }}>
        <Title>{who.firstName}'s calendar</Title>
        <Small>Plan as many weeks ahead as you like. {who.firstName} only sees Monday to Sunday of the current week.</Small>
      </View>
      {size === 'wide' ? (
        <View style={{ flexDirection: 'row', gap: 20, alignItems: 'flex-start' }}>
          <View style={{ flex: 1.6 }}>{view === 'week' ? weekGrid : grid}</View>
          <View style={{ flex: 1 }}>{day}</View>
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          {view === 'week' ? weekGrid : grid}
          {day}
        </View>
      )}
    </Page>
  );
}
