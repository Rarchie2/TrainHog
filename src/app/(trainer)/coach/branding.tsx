import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Body, BodyBold, Button, Card, Chip, H3, LOGOS, Mark, Page, Small, Tag, Title, useUI } from '@/components/ui';
import { APP_NAME } from '@/config';
import { useStore } from '@/data/store';
import { fonts, radius } from '@/theme';
import { contrast, isHex, paletteFor } from '@/theme/brand';

// Ready-made looks. TrainHog is the standard one.
const PRESETS = [
  { name: `${APP_NAME} (standard)`, theme: undefined, logo: undefined },
  { name: 'JMH Fitness', theme: { brand: '#009FE3', ink: '#1D1D1B' }, logo: 'jmh' },
];

// A trainer's own look in the app: their logo and brand colours. Their
// clients see it; other trainers' clients don't.
export default function Branding() {
  const st = useStore();
  const { c } = useUI();
  const b = st.business;
  const [brand, setBrand] = useState(b?.theme?.brand ?? '');
  const [ink, setInk] = useState(b?.theme?.ink ?? '');
  const [logo, setLogo] = useState<string | undefined>(b?.logo);
  const [saved, setSaved] = useState(false);
  const theme = isHex(brand) ? { brand: brand.startsWith('#') ? brand : `#${brand}`, ...(isHex(ink) ? { ink: ink.startsWith('#') ? ink : `#${ink}` } : {}) } : undefined;
  const p = paletteFor(theme, false);
  const input = { minHeight: 50, borderWidth: 1.5, borderColor: c.line, borderRadius: radius.md, paddingHorizontal: 12, fontFamily: fonts.body, fontSize: 16, color: c.ink, backgroundColor: c.surface } as const;
  const change = (fn: () => void) => {
    fn();
    setSaved(false);
  };

  return (
    <Page maxWidth={860}>
      <View style={{ gap: 4 }}>
        <Title>Your branding</Title>
        <Small>Your clients see your logo and colours in {APP_NAME}. Leave it on the standard look if you prefer.</Small>
      </View>
      <Card>
        <H3>Start from</H3>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {PRESETS.map((x) => (
            <Chip
              key={x.name}
              label={x.name}
              on={(theme?.brand ?? '') === (x.theme?.brand ?? '') && logo === x.logo}
              onPress={() =>
                change(() => {
                  setBrand(x.theme?.brand ?? '');
                  setInk(x.theme?.ink ?? '');
                  setLogo(x.logo);
                })
              }
            />
          ))}
        </View>
      </Card>
      <Card>
        <H3>Colours</H3>
        <Small>Your main brand colour, as a hex code like #009FE3. Blank uses the standard blue.</Small>
        <TextInput value={brand} onChangeText={(t) => change(() => setBrand(t))} placeholder="#1E5BD8" placeholderTextColor={c.muted} autoCapitalize="none" autoCorrect={false} style={input} accessibilityLabel="Brand colour" />
        <Small>Text colour (optional), e.g. #1D1D1B for near-black.</Small>
        <TextInput value={ink} onChangeText={(t) => change(() => setInk(t))} placeholder="#0F1A2E" placeholderTextColor={c.muted} autoCapitalize="none" autoCorrect={false} style={input} accessibilityLabel="Text colour" />
        {brand && !isHex(brand) ? <Tag label="That isn't a colour code yet. It should look like #009FE3." tone="warn" /> : null}
        {theme && contrast(p.brandText, '#FFFFFF') > contrast(theme.brand, '#FFFFFF') + 0.2 ? (
          <Small>Your colour is light, so text in that colour uses a slightly deeper shade to stay readable. Buttons keep your exact colour.</Small>
        ) : null}
      </Card>
      <Card>
        <H3>Logo</H3>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Chip label={`${APP_NAME} snout`} on={!logo} onPress={() => change(() => setLogo(undefined))} />
          {Object.entries(LOGOS).map(([key, l]) => (
            <Chip key={key} label={l.name} on={logo === key} onPress={() => change(() => setLogo(key))} />
          ))}
        </View>
        <Small>To add your own logo, send the file to Ryan and it'll appear here.</Small>
      </Card>
      <Card>
        <H3>Preview</H3>
        <View style={{ backgroundColor: p.bg, borderRadius: radius.lg, padding: 16, gap: 12, borderWidth: 1, borderColor: p.line }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Mark size={36} logo={logo ?? null} />
            <Text style={{ fontFamily: fonts.display, fontSize: 17, color: p.ink }}>{APP_NAME}</Text>
          </View>
          <Text style={{ fontFamily: fonts.heavy, fontSize: 12.5, letterSpacing: 1.2, color: p.brandText }}>UP NEXT</Text>
          <Text style={{ fontFamily: fonts.display, fontSize: 21, color: p.ink }}>Lower body strength A</Text>
          <View style={{ backgroundColor: p.brand, borderRadius: radius.lg, minHeight: 54, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="play" size={20} color={p.brandInk} />
            <Text style={{ fontFamily: fonts.bold, fontSize: 17, color: p.brandInk }}>Start session</Text>
          </View>
          <View style={{ alignSelf: 'flex-start', backgroundColor: p.brandSoft, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3 }}>
            <Text style={{ fontFamily: fonts.heavy, fontSize: 13, color: p.brandText }}>Superset A1</Text>
          </View>
        </View>
      </Card>
      <View style={{ gap: 10 }}>
        <Button
          full
          icon="check"
          title="Save branding"
          disabled={!!brand && !isHex(brand)}
          onPress={() => {
            st.setBranding(theme, logo);
            setSaved(true);
          }}
        />
        {saved ? <Tag label="Saved. Your clients see it next time they open the app." tone="ok" icon="check" /> : null}
        {!b ? <Body>Sign in as a trainer to save branding.</Body> : null}
      </View>
      <Card tone="soft">
        <BodyBold>Videos you film</BodyBold>
        <Body>Exercises with your video show "Video by {b?.name ?? 'you'}" under the video, so you're credited wherever it's used.</Body>
      </Card>
    </Page>
  );
}
