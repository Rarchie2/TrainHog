import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { MobileTopBar } from '@/components/ClientBits';
import { Icon } from '@/components/Icon';
import { Avatar, Body, BodyBold, Button, Card, Columns, H3, Page, Small, Title, Toggle, useLayout, useUI } from '@/components/ui';
import { useMe, useStore } from '@/data/store';
import { fonts, radius, TOUCH } from '@/theme';

function Row({ title, sub, children, onPress }: { title: string; sub?: string; children?: React.ReactNode; onPress?: () => void }) {
  const { c } = useUI();
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: TOUCH + 8, paddingVertical: 8, borderTopWidth: 1, borderTopColor: c.line }}
    >
      <View style={{ flex: 1 }}>
        <BodyBold>{title}</BodyBold>
        {sub ? <Small>{sub}</Small> : null}
      </View>
      {children ?? (onPress ? <Icon name="chev" size={20} color={c.muted} /> : null)}
    </Pressable>
  );
}

export default function Me() {
  const me = useMe();
  const st = useStore();
  const { c } = useUI();
  const { size } = useLayout();
  const [contrast, setContrast] = useState(false);
  const [aloud, setAloud] = useState(me.easyView);
  const [reminders, setReminders] = useState(true);
  const [faceId, setFaceId] = useState(false);

  return (
    <Page maxWidth={1100}>
      <MobileTopBar initials={me.initials} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Avatar initials={me.initials} size={56} />
        <View>
          <Title>
            {me.firstName} {me.lastName}
          </Title>
          <Small>Training with Hogan</Small>
        </View>
      </View>
      <Columns cols={size === 'compact' ? 1 : 2} gap={18}>
        <Card>
          <H3>Easier to use</H3>
          <Row title="Easy view" sub="Bigger text and buttons, fewer things on each screen">
            <Toggle label="Easy view" value={me.easyView} onChange={(v) => st.setEasyView(me.id, v)} />
          </Row>
          <Row title="High contrast">
            <Toggle label="High contrast" value={contrast} onChange={setContrast} />
          </Row>
          <Row title="Read instructions aloud">
            <Toggle label="Read instructions aloud" value={aloud} onChange={setAloud} />
          </Row>
          <Small>The app also follows your phone's own text size setting.</Small>
        </Card>
        <Card>
          <H3>Your trainer</H3>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Avatar initials="H" size={46} brand />
            <View>
              <BodyBold>Hogan</BodyBold>
              <Small>Personal trainer, Winchester</Small>
            </View>
          </View>
          <Button variant="ghost" icon="cal" title="Book a session" />
          <Small>Opens Hogan's booking page.</Small>
        </Card>
        <Card>
          <H3>Reminders and security</H3>
          <Row title="Session reminders" sub="Weekdays at 7:30am">
            <Toggle label="Session reminders" value={reminders} onChange={setReminders} />
          </Row>
          <Row title="Lock with Face ID or a PIN" sub="Useful on a shared family device">
            <Toggle label="Lock with Face ID" value={faceId} onChange={setFaceId} />
          </Row>
          <Row title="Signed in on this phone" sub="No password needed. If you change phone, Hogan can send a new link." />
        </Card>
        <Card>
          <H3>Privacy</H3>
          <Row title="See what Hogan can see" onPress={() => {}} />
          <Row title="Download my data" onPress={() => {}} />
          <Row title="Delete my account" onPress={() => {}} />
          <Small>TrainHog is a training tool, not medical advice. If something feels serious, call 999 or NHS 111.</Small>
        </Card>
      </Columns>

      <View style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: c.line, borderRadius: radius.lg, padding: 18, gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Icon name="switch" size={20} color={c.brand} />
          <H3>Demo controls</H3>
        </View>
        <Body>These are only here for showing the app. They won't be in the real thing.</Body>
        <Text style={{ fontFamily: fonts.bold, color: c.muted, fontSize: 14 }}>VIEW THE APP AS</Text>
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          {st.clients
            .filter((x) => x.id === 'c1' || x.id === 'c2')
            .map((x) => (
              <Button key={x.id} small variant={x.id === me.id ? 'primary' : 'ghost'} title={`${x.firstName}${x.easyView ? ' (Easy view)' : ''}`} onPress={() => st.setClient(x.id)} />
            ))}
          <Button small variant="outline" icon="inbox" title="Hogan's dashboard" onPress={() => router.navigate('/coach')} />
        </View>
        <Button small variant="ghost" title="Reset the demo data" onPress={st.reset} />
      </View>
    </Page>
  );
}
