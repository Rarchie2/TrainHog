import { useState } from 'react';
import { View } from 'react-native';
import { MobileTopBar } from '@/components/ClientBits';
import { PostCard, PresetPicker } from '@/components/Community';
import { Body, BodyBold, Button, Card, H3, IconBadge, Page, Small, Tag, Title, Toggle, useLayout } from '@/components/ui';
import { PRESETS } from '@/data/community';
import { useClientData } from '@/data/selectors';
import { useLookups, useMe, useStore } from '@/data/store';

export default function Community() {
  const st = useStore();
  const me = useMe();
  const d = useClientData(me.id);
  const { session } = useLookups();
  const { size } = useLayout();
  const [posted, setPosted] = useState(false);

  // Fill in the numbers so the presets say something real.
  const mine = st.bodyweights.filter((b) => b.clientId === me.id).sort((a, b) => a.date.localeCompare(b.date));
  const lost = mine.length > 1 ? Math.round((mine[0].kg - mine[mine.length - 1].kg) * 10) / 10 : 0;
  const details: Record<string, string | undefined> = {
    smashed: d.logs[0] ? session(d.logs[0].sessionId).name : undefined,
    lost: lost > 0 ? `${lost} kg` : undefined,
    streak: d.streak > 1 ? String(d.streak) : undefined,
  };
  const options = PRESETS.filter((p) => (p.needs === 'kg' ? !!details.lost : p.needs === 'weeks' ? !!details.streak : true)).map((p) => p.id);

  if (!me.community) {
    return (
      <Page maxWidth={720}>
        <MobileTopBar initials={me.initials} />
        <Title>Community</Title>
        <Card>
          <IconBadge name="users" size={52} />
          <H3>Cheer each other on</H3>
          <Body>See when other TrainHog clients finish a session or hit a goal, and share your own wins with an emoji post. Nobody writes anything, so it stays positive.</Body>
          <View style={{ gap: 6 }}>
            <Small>Only your first name and initial show.</Small>
            <Small>Your weight, check-ins and pain reports are never shared.</Small>
            <Small>You can leave any time in Me.</Small>
          </View>
          <Button full icon="check" title="Join the community" onPress={() => st.setCommunity(me.id, true)} />
        </Card>
      </Page>
    );
  }

  const share = (
    <Card>
      <H3>Share something</H3>
      {posted ? (
        <View style={{ gap: 10 }}>
          <Tag label="Posted" tone="ok" icon="check" />
          <Button small variant="ghost" title="Share something else" onPress={() => setPosted(false)} />
        </View>
      ) : (
        <PresetPicker
          options={options}
          details={details}
          onPick={(id, detail) => {
            st.post(id, detail);
            setPosted(true);
          }}
        />
      )}
    </Card>
  );

  const feed = (
    <View style={{ gap: 14 }}>
      {st.posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </View>
  );

  return (
    <Page maxWidth={1100}>
      <MobileTopBar initials={me.initials} />
      <View style={{ gap: 4 }}>
        <Title>Community</Title>
        <Small>Wins from everyone training with Hogan</Small>
      </View>
      {size === 'compact' ? (
        <View style={{ gap: 16 }}>
          {share}
          {feed}
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 20, alignItems: 'flex-start' }}>
          <View style={{ flex: 1.3 }}>{feed}</View>
          <View style={{ flex: 1, gap: 16 }}>
            {share}
            <Card tone="soft">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Toggle label="Show me in the community" value={!!me.community} onChange={(v) => st.setCommunity(me.id, v)} />
                <BodyBold style={{ flex: 1 }}>Show me in the community</BodyBold>
              </View>
            </Card>
          </View>
        </View>
      )}
    </Page>
  );
}
