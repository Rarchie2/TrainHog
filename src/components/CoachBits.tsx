import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { agoLabel } from '@/data/format';
import { useLookups, useStore } from '@/data/store';
import type { PainReport, SessionLog } from '@/data/types';
import { fonts, radius } from '@/theme';
import { BodyOutline } from './BodyMap';
import { FeelRow, ReplyBubble, useHardList } from './ClientBits';
import { Icon } from './Icon';
import { Avatar, Body, BodyBold, Button, Card, H2, Small, Tag, useLayout, useUI, VoiceNote } from './ui';

export function ReplyBox({ targetId, placeholder = 'Write a reply', onSent }: { targetId: string; placeholder?: string; onSent?: () => void }) {
  const st = useStore();
  const { c } = useUI();
  const [text, setText] = useState('');
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={c.muted}
        multiline
        accessibilityLabel={placeholder}
        style={{ flex: 1, minHeight: 48, maxHeight: 120, borderWidth: 1.5, borderColor: c.line, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 12, fontFamily: fonts.body, fontSize: 16, color: c.ink, backgroundColor: c.surface }}
      />
      <Button
        small
        icon="send"
        title="Send"
        disabled={!text.trim()}
        onPress={() => {
          st.reply(targetId, text.trim());
          setText('');
          onSent?.();
        }}
      />
    </View>
  );
}

export function PainCard({ report }: { report: PainReport }) {
  const st = useStore();
  const { client, repliesFor } = useLookups();
  const { c } = useUI();
  const { size } = useLayout();
  const [replying, setReplying] = useState(false);
  const who = client(report.clientId);
  const isNew = report.status === 'new';
  const replies = repliesFor(report.id);
  return (
    <Card tone={isNew ? 'danger' : 'plain'}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="alert" size={20} color={c.bad} />
        <Small color={c.bad} style={{ fontFamily: fonts.heavy, letterSpacing: 1 }}>
          {isNew ? 'PAIN REPORT · PINNED UNTIL SEEN' : 'PAIN REPORT · SEEN'}
        </Small>
      </View>
      <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
        <BodyOutline area={report.area} side={report.side} height={size === 'compact' ? 140 : 170} />
        <View style={{ flex: 1, gap: 10 }}>
          <Pressable onPress={() => router.navigate(`/coach/clients/${who.id}`)}>
            <H2>
              {who.firstName} {who.lastName} reported pain
            </H2>
          </Pressable>
          {[
            ['Where', `${report.side === 'Middle' ? '' : report.side + ' '}${report.area.toLowerCase()}, ${report.view}`],
            ['How bad', `${report.severity} out of 10`],
            ['Type', report.type],
            ['When', report.when],
            ['Reported', report.minutesAgo === 0 ? 'Just now' : agoLabel(report.minutesAgo)],
          ].map(([k, v]) => (
            <View key={k} style={{ flexDirection: 'row', gap: 12 }}>
              <Small style={{ width: 76 }}>{k}</Small>
              <BodyBold style={{ flex: 1 }}>{v}</BodyBold>
            </View>
          ))}
          {report.redFlag ? <Tag label="Safety warning shown to the client" tone="danger" icon="alert" /> : null}
        </View>
      </View>
      {replies.map((r) => (
        <ReplyBubble key={r.id} text={r.text} at={r.at} />
      ))}
      {replying ? (
        <ReplyBox targetId={report.id} placeholder={`Reply to ${who.firstName}`} onSent={() => setReplying(false)} />
      ) : (
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {isNew ? <Button small icon="check" title="Mark as seen" onPress={() => st.markPainSeen(report.id)} /> : null}
          <Button small variant="ghost" icon="send" title="Reply" onPress={() => setReplying(true)} />
          <Button small variant="ghost" title="Open client" onPress={() => router.navigate(`/coach/clients/${who.id}`)} />
        </View>
      )}
    </Card>
  );
}

export function CheckInItem({ log, showClient = true }: { log: SessionLog; showClient?: boolean }) {
  const st = useStore();
  const { client, session, repliesFor } = useLookups();
  const { c } = useUI();
  const [replying, setReplying] = useState(false);
  const who = client(log.clientId);
  const hard = useHardList(log);
  const replies = repliesFor(log.id);
  const ci = log.checkIn;
  return (
    <View style={{ flexDirection: 'row', gap: 12, paddingVertical: 14, borderTopWidth: 1, borderTopColor: c.line }}>
      {showClient ? <Avatar initials={who.initials} size={42} /> : null}
      <View style={{ flex: 1, gap: 8, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Pressable onPress={() => router.navigate(`/coach/clients/${who.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {!log.seenByTrainer ? <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: c.brand }} accessibilityLabel="New" /> : null}
              <BodyBold>{showClient ? `${who.firstName} ${who.lastName}` : session(log.sessionId).name}</BodyBold>
            </Pressable>
            {showClient ? <Small>{session(log.sessionId).name}</Small> : null}
          </View>
          <Small>{log.minutesAgo < 1440 ? agoLabel(log.minutesAgo) : log.dateLabel}</Small>
        </View>
        <FeelRow log={log} />
        {ci?.voiceNote ? <VoiceNote {...ci.voiceNote} /> : null}
        {ci?.enjoyed ? <Body>{ci.enjoyed}</Body> : null}
        {ci?.hardNote ? <Body>{ci.hardNote}</Body> : null}
        {ci?.forTrainer ? <Body>{ci.forTrainer}</Body> : null}
        {hard.length ? <Tag label={`Found hard: ${hard.join(', ')}`} tone="warn" /> : null}
        {replies.map((r) => (
          <ReplyBubble key={r.id} text={r.text} at={r.at} />
        ))}
        {replying ? (
          <ReplyBox targetId={log.id} placeholder={`Reply to ${who.firstName}`} onSent={() => setReplying(false)} />
        ) : ci ? (
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Button small variant="ghost" icon="send" title="Reply" onPress={() => setReplying(true)} />
            {!log.seenByTrainer ? <Button small variant="ghost" icon="check" title="Seen" onPress={() => st.markLogSeen(log.id)} /> : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}
