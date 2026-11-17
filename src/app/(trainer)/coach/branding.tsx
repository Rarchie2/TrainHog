import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Body, BodyBold, Button, Card, Chip, H3, LOGOS, Mark, Page, Small, Tag, Title, useUI } from '@/components/ui';
import { APP_NAME } from '@/config';
import { LOGO_MAX_BYTES, pickLogo, uploadLogo } from '@/data/logo';
import { useStore } from '@/data/store';
import { fonts, radius } from '@/theme';
import { contrast, isHex, paletteFor } from '@/theme/brand';

// Ready-made looks. TrainHog is the standard one.
const PRESETS = [
  { name: `${APP_NAME} (standard)`, theme: undefined, logo: undefined },
  { name: 'JMH Fitness', theme: { brand: '#009FE3', ink: '#1D1D1B' }, logo: 'jmh' },
];

// Brand colours to pick from with one tap. All work with the app's text
// (light ones get a deeper shade for text automatically). No reds, because
// red means "missed" or "pain" in the app.
const SWATCHES = [
  { name: 'TrainHog blue', hex: '#1E5BD8' },
  { name: 'Sky blue', hex: '#009FE3' },
  { name: 'Navy', hex: '#1F2A5C' },
  { name: 'Teal', hex: '#0F9D8A' },
  { name: 'Green', hex: '#2E9E4F' },
  { name: 'Lime', hex: '#7CB518' },
  { name: 'Gold', hex: '#C9A227' },
  { name: 'Orange', hex: '#F26B1D' },
  { name: 'Pink', hex: '#D63384' },
  { name: 'Purple', hex: '#6F42C1' },
  { name: 'Charcoal', hex: '#2D2D2D' },
];

const INKS = [
  { name: 'Standard', hex: '' },
  { name: 'Near-black', hex: '#1D1D1B' },
  { name: 'Deep navy', hex: '#0F1A2E' },
];

const norm = (h: string) => (h.startsWith('#') ? h : `#${h}`).toUpperCase();

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
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const isUpload = !!logo && !LOGOS[logo];
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
        <Small>Tap a colour close to your brand, or type your exact colour code below.</Small>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {SWATCHES.map((x) => {
            const on = isHex(brand) && norm(brand) === x.hex;
            return (
              <Pressable
                key={x.hex}
                accessibilityRole="button"
                accessibilityLabel={x.name}
                accessibilityState={{ selected: on }}
                onPress={() => change(() => setBrand(x.hex))}
                style={{ alignItems: 'center', gap: 4, width: 72 }}
              >
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: x.hex, borderWidth: on ? 3 : 1, borderColor: on ? c.ink : c.line, alignItems: 'center', justifyContent: 'center' }}>
                  {on ? <Icon name="check" size={22} color={contrast(x.hex, '#FFFFFF') >= 3 ? '#FFFFFF' : '#1D1D1B'} /> : null}
                </View>
                <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: c.muted, textAlign: 'center' }} numberOfLines={1}>
                  {x.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Small>Your exact brand colour (optional), as a code like #009FE3. Blank uses the standard blue.</Small>
        <TextInput value={brand} onChangeText={(t) => change(() => setBrand(t))} placeholder="#1E5BD8" placeholderTextColor={c.muted} autoCapitalize="none" autoCorrect={false} style={input} accessibilityLabel="Brand colour" />
        <Small>Text colour</Small>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {INKS.map((x) => (
            <Chip key={x.name} label={x.name} on={(isHex(ink) ? norm(ink) : '') === x.hex} onPress={() => change(() => setInk(x.hex))} />
          ))}
        </View>
        <Small>Or type your own text colour code (optional).</Small>
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
          {isUpload ? <Chip label="Your logo" on onPress={() => {}} /> : null}
        </View>
        {isUpload ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Mark size={64} logo={logo} />
            <Small style={{ flex: 1 }}>This is the logo your clients will see at the top of their app.</Small>
          </View>
        ) : null}
        <Button
          small
          variant="ghost"
          icon="plus"
          title={busy ? 'Uploading…' : isUpload ? 'Choose a different logo' : 'Upload your logo'}
          disabled={busy}
          onPress={async () => {
            setProblem(null);
            try {
              const picked = await pickLogo();
              if (!picked) return;
              if (picked.bytes > LOGO_MAX_BYTES) throw new Error('That image is too big. Please use one under 1 MB.');
              setBusy(true);
              // Demo: just show it. Signed in: store it so clients' phones can load it.
              const url = b?.id && st.mode === 'live' ? await uploadLogo(b.id, picked) : picked.uri;
              change(() => setLogo(url));
            } catch (e) {
              setProblem(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
            } finally {
              setBusy(false);
            }
          }}
        />
        <Small>A square or wide logo works best, ideally a PNG with a see-through background. It's shrunk automatically and must be under 1 MB. Press Save branding afterwards.</Small>
        {problem ? <Tag label={problem} tone="warn" /> : null}
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
          disabled={busy || (!!brand && !isHex(brand))}
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
