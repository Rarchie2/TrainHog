import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_NAME } from '@/config';
import { useStore } from '@/data/store';
import { fonts, radius } from '@/theme';
import { Icon } from './Icon';
import { Body, BodyBold, Button, Card, Mark, Small, Title, useUI } from './ui';

// No passwords: type your email, get a 6-digit code, type it in.
export function SignIn() {
  const st = useStore();
  const { c } = useUI();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = { minHeight: 54, borderWidth: 1.5, borderColor: c.line, borderRadius: radius.md, paddingHorizontal: 14, fontFamily: fonts.body, fontSize: 18, color: c.ink, backgroundColor: c.surface } as const;
  const validEmail = /^\S+@\S+\.\S+$/.test(email.trim());

  const send = async () => {
    setBusy(true);
    setError(null);
    st.clearSyncError();
    const err = await st.sendCode(email);
    setBusy(false);
    if (err) setError(friendly(err));
    else setStep('code');
  };
  const verify = async () => {
    setBusy(true);
    setError(null);
    const err = await st.verifyCode(email, code);
    setBusy(false);
    if (err) setError(friendly(err));
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }}>
        <View style={{ width: '100%', maxWidth: 440, alignSelf: 'center', gap: 18 }}>
          <View style={{ alignItems: 'center', gap: 10 }}>
            <Mark size={64} />
            <Title center>{APP_NAME}</Title>
            <Small>Training with Hogan</Small>
          </View>
          <Card>
            {step === 'email' ? (
              <>
                <BodyBold>Sign in with your email</BodyBold>
                <Small>Use the email Hogan has for you. We'll email you a sign-in link. No password needed.</Small>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={c.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  returnKeyType="send"
                  onSubmitEditing={() => validEmail && send()}
                  style={input}
                  accessibilityLabel="Email address"
                />
                <Button full icon="send" title={busy ? 'Sending…' : 'Email me a sign-in link'} disabled={!validEmail || busy} onPress={send} />
              </>
            ) : (
              <>
                <BodyBold>Check your email</BodyBold>
                <Body>
                  We sent a sign-in link to {email.trim()}. Open the email <Text style={{ fontFamily: fonts.bold }}>on this phone</Text> and tap the link. TrainHog opens and you're in.
                </Body>
                <Small>It can take a minute. Check your junk folder too. If the email has a 6-digit code, you can type it here instead:</Small>
                <TextInput
                  value={code}
                  onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 8))}
                  placeholder="123456"
                  placeholderTextColor={c.muted}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete="one-time-code"
                  returnKeyType="done"
                  onSubmitEditing={() => code.length >= 6 && verify()}
                  style={[input, { fontSize: 26, letterSpacing: 6, textAlign: 'center', fontFamily: fonts.bold }]}
                  accessibilityLabel="6-digit code"
                />
                <Button full icon="check" title={busy ? 'Checking…' : 'Sign in'} disabled={code.length < 6 || busy} onPress={verify} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Button small variant="ghost" title="Different email" onPress={() => { setStep('email'); setCode(''); setError(null); }} />
                  <Button small variant="ghost" title="Send again" disabled={busy} onPress={send} />
                </View>
              </>
            )}
            {error || st.syncError ? (
              <View style={{ flexDirection: 'row', gap: 8, backgroundColor: c.warnSoft, padding: 12, borderRadius: 12 }}>
                <Icon name="alert" size={20} color={c.warn} />
                <Body style={{ flex: 1 }}>{error ?? st.syncError}</Body>
              </View>
            ) : null}
          </Card>
          <Pressable accessibilityRole="button" onPress={st.startDemo} style={{ alignSelf: 'center', minHeight: 48, justifyContent: 'center' }}>
            <Text style={{ fontFamily: fonts.bold, color: c.brand, fontSize: 16 }}>Just looking? Try the demo</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function friendly(msg: string) {
  if (/rate|too many|seconds/i.test(msg)) return 'Too many codes asked for. Wait a minute and try again.';
  if (/expired|invalid|token/i.test(msg)) return "That code didn't work. Check it, or tap Send again for a new one.";
  if (/network|fetch/i.test(msg)) return 'No connection. Check your signal and try again.';
  return msg;
}

// Shown while the app checks the sign-in and loads everything.
export function Loading() {
  const { c } = useUI();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: c.bg }}>
      <Mark size={56} />
      <ActivityIndicator color={c.brand} />
    </View>
  );
}

// Signed in, but this email isn't a client or trainer yet.
export function NoAccount() {
  const st = useStore();
  const { c } = useUI();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: c.bg }}>
      <View style={{ maxWidth: 440, width: '100%', gap: 16 }}>
        <Title center>Almost there</Title>
        <Body center>
          {st.account?.email} isn't on Hogan's client list yet. Ask Hogan to add you with this email, then tap Try again.
        </Body>
        <Button full icon="check" title="Try again" onPress={st.refreshAccount} />
        <Button full variant="ghost" title="Sign out" onPress={st.signOut} />
      </View>
    </View>
  );
}

// A save that didn't go through.
export function SyncBanner() {
  const st = useStore();
  const { c } = useUI();
  const insets = useSafeAreaInsets();
  if (!st.syncError) return null;
  return (
    <View style={{ position: 'absolute', left: 12, right: 12, top: insets.top + 8, backgroundColor: c.warnSoft, borderRadius: 14, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center', borderWidth: 1, borderColor: c.warn }}>
      <Icon name="alert" size={20} color={c.warn} />
      <Small style={{ flex: 1, color: c.ink }}>{st.syncError}</Small>
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" onPress={st.clearSyncError} style={{ minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="x" size={18} color={c.ink} />
      </Pressable>
    </View>
  );
}
