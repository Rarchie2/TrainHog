import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Body, BodyBold, Button, Card, Eyebrow, H3, LevelBars, Meta, Page, Small, Tag, Thumb, Title, useLayout, useUI } from '@/components/ui';
import { prescription } from '@/data/format';
import { useLookups, useMe, useStore } from '@/data/store';
import { TOUCH } from '@/theme';

export default function SessionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useMe();
  const st = useStore();
  const { session, exercise } = useLookups();
  const { c } = useUI();
  const { size } = useLayout();
  const s = session(id);
  if (!s) return <Page><Body>That session could not be found.</Body></Page>;
  const assignment = st.assignments.find((a) => a.clientId === me.id && a.sessionId === id);

  const overview = (
    <Card>
      <Thumb label={s.name} duration="1:40" />
      <Eyebrow color={c.brand}>{s.category}</Eyebrow>
      <Title>{s.name}</Title>
      <Body>{s.purpose}</Body>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 4 }}>
        <Meta icon="clock" text={`${s.minutes} min`} />
        <Meta icon="dumbbell" text={s.equipment} />
        <LevelBars level={s.level} />
      </View>
      {s.safetyNote ? (
        <View style={{ flexDirection: 'row', gap: 8, backgroundColor: c.warnSoft, padding: 12, borderRadius: 12 }}>
          <Icon name="alert" size={20} color={c.warn} />
          <Body style={{ flex: 1 }}>{s.safetyNote}</Body>
        </View>
      ) : null}
      <Button full icon="play" title="Start session" onPress={() => router.navigate(`/workout/${s.id}`)} />
      {assignment ? (
        <Button
          full
          variant="ghost"
          icon={assignment.favourite ? 'starFilled' : 'star'}
          title={assignment.favourite ? 'In your favourites' : 'Add to favourites'}
          onPress={() => st.toggleFavourite(assignment.id)}
        />
      ) : null}
    </Card>
  );

  const list = (
    <Card>
      <H3>{s.exercises.length} exercises</H3>
      {s.exercises.map((x, i) => {
        const e = exercise(x.exerciseId);
        return (
          <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 6, borderTopWidth: i ? 1 : 0, borderTopColor: c.line }}>
            <Thumb label={e.name} width={92} compact />
            <View style={{ flex: 1, gap: 2 }}>
              <BodyBold>
                {i + 1}. {e.name}
              </BodyBold>
              <Small>{prescription(x)}</Small>
              {x.note ? <Tag label={x.note} tone="warn" /> : null}
            </View>
          </View>
        );
      })}
    </Card>
  );

  return (
    <Page maxWidth={1100}>
      <Pressable accessibilityRole="button" onPress={() => (router.canGoBack() ? router.back() : router.navigate('/sessions'))} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: TOUCH, alignSelf: 'flex-start' }}>
        <Icon name="back" size={22} color={c.brand} />
        <BodyBold color={c.brand}>My sessions</BodyBold>
      </Pressable>
      {size === 'compact' ? (
        <View style={{ gap: 16 }}>
          {overview}
          {list}
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 20, alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>{overview}</View>
          <View style={{ flex: 1.1 }}>{list}</View>
        </View>
      )}
    </Page>
  );
}
