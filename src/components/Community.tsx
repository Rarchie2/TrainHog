import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { presetLine, PRESETS, REACTIONS } from '@/data/community';
import { useLookups, useStore } from '@/data/store';
import type { CommunityPost } from '@/data/types';
import { fonts, radius } from '@/theme';
import { Avatar, BodyBold, Card, Small, Tag, useUI } from './ui';

export function PostCard({ post }: { post: CommunityPost }) {
  const st = useStore();
  const { client } = useLookups();
  const { c, k } = useUI();
  const who = client(post.clientId);
  const preset = PRESETS.find((p) => p.id === post.presetId);
  const mine = post.clientId === st.clientId;
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar initials={who.initials} size={42} brand={mine} />
        <View style={{ flex: 1 }}>
          <BodyBold>{mine ? 'You' : `${who.firstName} ${who.lastName[0]}.`}</BodyBold>
          <Small>{post.at}</Small>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: c.brandSoft, borderRadius: radius.md, padding: 16 }}>
        <Text style={{ fontSize: Math.round(40 * k) }}>{preset?.emoji}</Text>
        <Text style={{ flex: 1, fontFamily: fonts.display, fontSize: Math.round(19 * k), color: c.ink }}>{presetLine(post.presetId, post.detail)}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {REACTIONS.map((e) => {
          const who = post.reactions[e] ?? [];
          const on = who.includes(st.clientId);
          return (
            <Pressable
              key={e}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`React ${e}${who.length ? `, ${who.length} so far` : ''}`}
              onPress={() => st.react(post.id, e)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1.5, borderColor: on ? c.brand : c.line, backgroundColor: on ? c.brandSoft : c.surface }}
            >
              <Text style={{ fontSize: 18 }}>{e}</Text>
              {who.length ? <Text style={{ fontFamily: fonts.bold, color: c.ink, fontSize: 14 }}>{who.length}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

// Big tap targets, one per preset. No typing.
export function PresetPicker({ options, details, onPick }: { options: string[]; details: Record<string, string | undefined>; onPick: (id: string, detail?: string) => void }) {
  const { c, k } = useUI();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {PRESETS.filter((p) => options.includes(p.id)).map((p) => (
        <Pressable
          key={p.id}
          accessibilityRole="button"
          onPress={() => onPick(p.id, details[p.id])}
          style={({ pressed }) => ({ flexBasis: '46%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, minHeight: 64, borderRadius: radius.md, borderWidth: 1.5, borderColor: c.line, backgroundColor: c.surface, opacity: pressed ? 0.8 : 1 })}
        >
          <Text style={{ fontSize: Math.round(28 * k) }}>{p.emoji}</Text>
          <Text style={{ flex: 1, fontFamily: fonts.bold, fontSize: Math.round(15 * k), color: c.ink }}>{presetLine(p.id, details[p.id])}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// Shown after a check-in for clients who opted in.
export function SharePrompt({ sessionName }: { sessionName: string }) {
  const st = useStore();
  const [posted, setPosted] = useState(false);
  if (posted) return <Tag label="Posted to the community" tone="ok" icon="check" />;
  return (
    <Card style={{ width: '100%' }}>
      <BodyBold>Share it with the TrainHog community?</BodyBold>
      <Small>Pick one. Only your first name shows.</Small>
      <PresetPicker
        options={['smashed', 'tough', 'checkin']}
        details={{ smashed: sessionName }}
        onPick={(id, detail) => {
          st.post(id, detail);
          setPosted(true);
        }}
      />
    </Card>
  );
}
