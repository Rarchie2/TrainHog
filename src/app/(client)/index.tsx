import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { CategoryTile, MessageCard, MobileTopBar } from '@/components/ClientBits';
import { Icon } from '@/components/Icon';
import {
  Avatar,
  Body,
  BodyBold,
  Button,
  Card,
  Eyebrow,
  Face,
  FEEL_LABELS,
  H2,
  IconBadge,
  LevelBars,
  Meta,
  Page,
  SectionHead,
  Small,
  Tag,
  Thumb,
  Title,
  useLayout,
  useUI,
} from '@/components/ui';
import { longDate } from '@/data/sample';
import { greeting, useClientData } from '@/data/selectors';
import { useLookups, useMe } from '@/data/store';
import { fonts, radius } from '@/theme';

export default function Today() {
  const me = useMe();
  return me.easyView ? <EasyToday /> : <CleanToday />;
}

// Concept A: Clean cards.
function CleanToday() {
  const me = useMe();
  const { size } = useLayout();
  const d = useClientData(me.id);
  const { session } = useLookups();
  const { c } = useUI();

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
      <View style={{ flex: 1, gap: 4 }}>
        <Eyebrow>{longDate(new Date())}</Eyebrow>
        <Title>
          {greeting()}, {me.firstName}
        </Title>
      </View>
      {size !== 'compact' ? <Avatar initials={me.initials} size={44} /> : null}
    </View>
  );

  const hero = d.planned ? (
    <Card style={{ padding: 10 }} key="hero">
      <View style={{ flexDirection: size === 'compact' ? 'column' : 'row', gap: 16 }}>
        <View style={{ flex: size === 'compact' ? undefined : 1.1 }}>
          <Thumb label={d.planned.session.name} duration="0:22" />
        </View>
        <View style={{ flex: 1, gap: 12, padding: 8, justifyContent: 'center' }}>
          <Eyebrow color={c.brand}>{d.planned.assignment.days.length ? "Today's session" : 'Up next'}</Eyebrow>
          <H2>{d.planned.session.name}</H2>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 4 }}>
            <Meta icon="clock" text={`${d.planned.session.minutes} min`} />
            <Meta icon="dumbbell" text={d.planned.session.equipment} />
            <LevelBars level={d.planned.session.level} />
            <Meta text={`${d.planned.session.exercises.length} exercises`} />
          </View>
          {d.doneToday ? (
            <View style={{ gap: 10 }}>
              <Tag label="Done today. Nice work." tone="ok" icon="check" />
              {!d.doneToday.checkIn ? (
                <Button full variant="warn" icon="chat" title="Check in with Hogan" onPress={() => router.navigate(`/checkin/${d.doneToday!.id}`)} />
              ) : null}
            </View>
          ) : (
            <Button full icon="play" title="Start session" onPress={() => router.navigate(`/workout/${d.planned!.session.id}`)} />
          )}
          <Pressable accessibilityRole="button" onPress={() => router.navigate(`/sessions/${d.planned!.session.id}`)} style={{ alignSelf: 'center', minHeight: 44, justifyContent: 'center' }}>
            <Text style={{ fontFamily: fonts.bold, color: c.brand, fontSize: 15 }}>See what's in it</Text>
          </Pressable>
        </View>
      </View>
    </Card>
  ) : null;

  const message = d.messages[0] ? <MessageCard key="msg" text={d.messages[0].text} at={d.messages[0].at} /> : null;

  const reminder =
    d.missingCheckIn && d.missingCheckIn.id !== d.doneToday?.id ? (
      <Card tone="warn" key="remind">
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Icon name="clock" size={22} color={c.warn} />
          <Body style={{ flex: 1 }}>
            You haven't checked in on {d.missingCheckIn.dateLabel.toLowerCase() === 'yesterday' ? "yesterday's" : `${d.missingCheckIn.dateLabel}'s`}{' '}
            <Text style={{ fontFamily: fonts.bold }}>{session(d.missingCheckIn.sessionId).name}</Text> yet. It takes about 30 seconds.
          </Body>
        </View>
        <Button small variant="warn" title="Check in now" onPress={() => router.navigate(`/checkin/${d.missingCheckIn!.id}`)} />
      </Card>
    ) : null;

  const week = (
    <Card key="week">
      <SectionHead title="This week" />
      <Small style={{ marginTop: -8 }}>
        {d.doneThisWeek} of {Math.max(d.plannedThisWeek, d.doneThisWeek)} done
      </Small>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {d.week.map((day) => (
          <View key={day.iso} style={{ alignItems: 'center', gap: 6, flex: 1 }} accessibilityLabel={`${day.label} ${day.date}${day.done ? ', done' : day.planned ? ', planned' : ''}`}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: day.isToday ? c.brand : c.muted }}>{day.label[0]}</Text>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: day.done ? c.brand : day.planned || day.isToday ? 'transparent' : c.surface2,
                borderWidth: day.done ? 0 : day.isToday ? 3 : day.planned ? 2 : 0,
                borderColor: c.brand,
              }}
            >
              {day.done ? <Icon name="check" size={18} color={c.brandInk} /> : <Text style={{ fontFamily: day.isToday ? fonts.heavy : fonts.semibold, color: c.ink, fontSize: 14 }}>{day.date}</Text>}
              {day.note ? <View style={{ position: 'absolute', bottom: 3, width: 5, height: 5, borderRadius: 3, backgroundColor: c.warn }} /> : null}
            </View>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap' }}>
        <Legend color={c.brand} label="Done" filled />
        <Legend color={c.brand} label="Planned" />
        <Legend color={c.warn} label="Diary note" filled />
      </View>
    </Card>
  );

  const cats = (
    <View key="cats" style={{ gap: 10 }}>
      <SectionHead title="Your categories" action="See all" onAction={() => router.navigate('/sessions')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {d.categories.map(([cat, n]) => (
          <View key={cat} style={{ flexBasis: size === 'wide' ? '31%' : '47%', flexGrow: 1 }}>
            <CategoryTile category={cat} count={n} onPress={() => router.navigate({ pathname: '/sessions', params: { category: cat } } as never)} />
          </View>
        ))}
      </View>
    </View>
  );

  const recent = (
    <Card key="diary">
      <SectionHead title="Recent diary" action="Open diary" onAction={() => router.navigate('/diary')} />
      {d.logs.slice(0, 3).map((l) => (
        <Pressable key={l.id} onPress={() => router.navigate('/diary')} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 48 }}>
          {l.checkIn ? <Face feel={l.checkIn.feel} size={34} /> : <IconBadge name="clock" tone="warn" size={34} />}
          <View style={{ flex: 1 }}>
            <BodyBold numberOfLines={1}>{session(l.sessionId).name}</BodyBold>
            <Small>
              {l.dateLabel} · {l.checkIn ? `${FEEL_LABELS[l.checkIn.feel]}, effort ${l.checkIn.effort}/10` : 'Check-in to do'}
            </Small>
          </View>
        </Pressable>
      ))}
    </Card>
  );

  return (
    <Page>
      <MobileTopBar initials={me.initials} />
      {header}
      {size === 'compact' ? (
        <View style={{ gap: 16 }}>
          {message}
          {hero}
          {reminder}
          {week}
          {cats}
          {recent}
        </View>
      ) : size === 'medium' ? (
        <View style={{ flexDirection: 'row', gap: 18, alignItems: 'flex-start' }}>
          <View style={{ flex: 1.45, gap: 18 }}>
            {hero}
            {cats}
          </View>
          <View style={{ flex: 1, gap: 18 }}>
            {message}
            {reminder}
            {week}
            {recent}
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 20, alignItems: 'flex-start' }}>
          <View style={{ flex: 1.5, gap: 20 }}>
            {hero}
            {cats}
          </View>
          <View style={{ flex: 1, gap: 20 }}>
            {message}
            {reminder}
          </View>
          <View style={{ flex: 1, gap: 20 }}>
            {week}
            {recent}
          </View>
        </View>
      )}
    </Page>
  );
}

function Legend({ color, label, filled }: { color: string; label: string; filled?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: filled ? color : 'transparent', borderWidth: filled ? 0 : 2, borderColor: color }} />
      <Small>{label}</Small>
    </View>
  );
}

// Easy view: one big button per job, larger text, labels on everything.
function EasyToday() {
  const me = useMe();
  const { size } = useLayout();
  const d = useClientData(me.id);
  const { c, k } = useUI();
  const t = d.planned?.session;

  const big = t ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Start today's session, ${t.name}`}
      onPress={() => router.navigate(`/workout/${t.id}`)}
      style={({ pressed }) => ({ backgroundColor: c.brand, borderRadius: radius.lg, padding: 22, flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 130, opacity: pressed ? 0.9 : 1 })}
    >
      <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="play" size={32} color="#fff" />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ fontFamily: fonts.display, color: '#fff', fontSize: Math.round(24 * k) }}>Start today's session</Text>
        <Text style={{ fontFamily: fonts.medium, color: '#fff', fontSize: Math.round(16 * k), opacity: 0.92 }}>
          {t.name} · {t.minutes} minutes · You need {t.equipment.toLowerCase()}
        </Text>
      </View>
      <Icon name="chev" size={28} color="#fff" />
    </Pressable>
  ) : null;

  const msg = d.messages[0] ? (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar initials="H" size={44} />
        <View>
          <BodyBold>Message from Hogan</BodyBold>
          <Small>{d.messages[0].at}</Small>
        </View>
      </View>
      <Body>{d.messages[0].text}</Body>
      <Button small variant="ghost" icon="speaker" title="Read it to me" />
    </Card>
  ) : null;

  const btns = [
    { icon: 'grid' as const, title: 'My sessions', sub: `${d.mySessions.length} sessions from Hogan`, href: '/sessions' },
    { icon: 'book' as const, title: 'My diary', sub: `${d.doneThisWeek} sessions this week`, href: '/diary' },
    { icon: 'chat' as const, title: 'Tell Hogan how I feel', sub: 'Including any pain', href: d.logs[0] ? `/checkin/${d.logs[0].id}` : '/diary' },
  ];

  return (
    <Page>
      <MobileTopBar initials={me.initials} />
      <View style={{ gap: 6 }}>
        <Tag label="Easy view is on" icon="check" />
        <Title>
          {greeting()}, {me.firstName}
        </Title>
        <Small>{longDate(new Date())}</Small>
      </View>
      <View style={{ flexDirection: size === 'compact' ? 'column' : 'row', gap: 18 }}>
        <View style={{ flex: size === 'compact' ? undefined : 1.2 }}>{big}</View>
        <View style={{ flex: size === 'compact' ? undefined : 1 }}>{msg}</View>
      </View>
      <View style={{ flexDirection: size === 'compact' ? 'column' : 'row', gap: 14 }}>
        {btns.map((b) => (
          <Pressable
            key={b.title}
            accessibilityRole="button"
            onPress={() => router.navigate(b.href as never)}
            style={({ pressed }) => ({ flex: size === 'compact' ? undefined : 1, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, minHeight: 84, borderRadius: radius.lg, borderWidth: 2, borderColor: c.line, backgroundColor: c.surface, opacity: pressed ? 0.85 : 1 })}
          >
            <IconBadge name={b.icon} size={52} />
            <View style={{ flex: 1 }}>
              <BodyBold>{b.title}</BodyBold>
              <Small>{b.sub}</Small>
            </View>
            <Icon name="chev" size={26} color={c.muted} />
          </Pressable>
        ))}
      </View>
    </Page>
  );
}
