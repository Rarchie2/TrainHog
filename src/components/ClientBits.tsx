import { router } from 'expo-router';
import { Modal, Pressable, Text, View } from 'react-native';
import { APP_NAME } from '@/config';
import { useLookups } from '@/data/store';
import type { Assignment, Session, SessionLog } from '@/data/types';
import { fonts, radius, TOUCH } from '@/theme';
import { Icon } from './Icon';
import {
  Avatar,
  Body,
  BodyBold,
  Button,
  Card,
  CATEGORY_ICON,
  Face,
  FEEL_LABELS,
  H2,
  IconBadge,
  LevelBars,
  Mark,
  Meta,
  Small,
  Tag,
  Thumb,
  useLayout,
  useUI,
} from './ui';

// Phone-only top bar. On iPad and laptop the brand sits in the side menu.
export function MobileTopBar({ initials }: { initials: string }) {
  const { size } = useLayout();
  const { c } = useUI();
  if (size !== 'compact') return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Mark size={32} />
      <Text style={{ fontFamily: fonts.display, fontSize: 17, color: c.ink, flex: 1 }}>{APP_NAME}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Me and settings" onPress={() => router.navigate('/me')}>
        <Avatar initials={initials} size={38} />
      </Pressable>
    </View>
  );
}

export function SessionCard({ session, assignment, onPress }: { session: Session; assignment?: Assignment; onPress?: () => void }) {
  const { c } = useUI();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${session.name}, ${session.minutes} minutes`}
      onPress={onPress ?? (() => router.navigate(`/sessions/${session.id}`))}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 10,
        borderRadius: radius.lg,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.line,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Thumb label={session.name} width={112} compact />
      <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
        <BodyBold numberOfLines={2}>{session.name}</BodyBold>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 2 }}>
          <Meta icon="clock" text={`${session.minutes} min`} />
          <Meta text={session.equipment} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <LevelBars level={session.level} />
          {assignment?.isNew ? <Tag label="New from Hogan" tone="warn" /> : null}
          {assignment?.favourite ? <Tag label="Favourite" icon="starFilled" /> : null}
        </View>
      </View>
      <Icon name="chev" size={22} color={c.muted} />
    </Pressable>
  );
}

export function CategoryTile({ category, count, onPress }: { category: Session['category']; count: number; onPress: () => void }) {
  const { c } = useUI();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${category}, ${count} sessions`}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: TOUCH + 16,
        padding: 12,
        borderRadius: radius.md,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.line,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <IconBadge name={CATEGORY_ICON[category]} size={40} />
      <View style={{ flex: 1 }}>
        <BodyBold>{category}</BodyBold>
        <Small>{count} session{count === 1 ? '' : 's'}</Small>
      </View>
    </Pressable>
  );
}

export function MessageCard({ text, at }: { text: string; at: string }) {
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar initials="H" size={40} />
        <View>
          <BodyBold>Message from Hogan</BodyBold>
          <Small>{at}</Small>
        </View>
      </View>
      <SmallQuote text={text} />
    </Card>
  );
}

function SmallQuote({ text }: { text: string }) {
  const { c, k } = useUI();
  return <Text style={{ fontFamily: fonts.body, fontSize: Math.round(17 * k), lineHeight: Math.round(25 * k), color: c.ink }}>{text}</Text>;
}

export function ReplyBubble({ text, at }: { text: string; at: string }) {
  const { c } = useUI();
  return (
    <View style={{ flexDirection: 'row', gap: 10, backgroundColor: c.surface2, borderRadius: radius.md, padding: 12 }}>
      <Avatar initials="H" size={32} brand />
      <View style={{ flex: 1, gap: 2 }}>
        <Small color={c.ink} style={{ fontFamily: fonts.bold }}>Hogan replied · {at}</Small>
        <SmallQuote text={text} />
      </View>
    </View>
  );
}

export function FeelRow({ log }: { log: SessionLog }) {
  if (!log.checkIn) return <Tag label="Check-in not done yet" tone="warn" icon="clock" />;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <Face feel={log.checkIn.feel} size={32} />
      <BodyBold>{FEEL_LABELS[log.checkIn.feel]}</BodyBold>
      <Tag label={`Effort ${log.checkIn.effort}/10`} tone="neutral" />
      {log.checkIn.pain ? <Tag label="Pain reported" tone="danger" icon="alert" /> : null}
    </View>
  );
}

export function useHardList(log: SessionLog) {
  const { exercise } = useLookups();
  return (log.checkIn?.hardExerciseIds ?? []).map((id) => exercise(id).name);
}

// Weekly check-in: a card on Today, plus a pop-up the first time the app opens
// while it's due. On the phone build this becomes a push notification too.
export function WeeklyCard() {
  return (
    <Card tone="soft">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconBadge name="cal" size={44} />
        <View style={{ flex: 1 }}>
          <BodyBold>Your weekly check-in is ready</BodyBold>
          <Small>8 quick questions for Hogan, about 2 minutes</Small>
        </View>
      </View>
      <Button small icon="chat" title="Start weekly check-in" onPress={() => router.navigate('/weekly')} />
    </Card>
  );
}

export function WeeklyPrompt({ visible, onLater }: { visible: boolean; onLater: () => void }) {
  const { c } = useUI();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onLater}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15,26,46,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <View style={{ width: '100%', maxWidth: 420, backgroundColor: c.surface, borderRadius: 22, padding: 22, gap: 14 }} accessibilityViewIsModal>
          <IconBadge name="bell" size={52} />
          <H2>Time for your weekly check-in</H2>
          <Body>Hogan uses this to tweak your plan for next week. It's 8 quick questions and takes about 2 minutes.</Body>
          <Button
            full
            icon="chat"
            title="Start now"
            onPress={() => {
              onLater();
              router.navigate('/weekly');
            }}
          />
          <Button full variant="ghost" title="Later" onPress={onLater} />
        </View>
      </View>
    </Modal>
  );
}
