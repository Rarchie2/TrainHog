import { router } from 'expo-router';
import { View } from 'react-native';
import { Body, BodyBold, Button, Card, H3, Page, Small, Title } from '@/components/ui';
import { supabase } from '@/data/backend';
import { useStore } from '@/data/store';

// The trainer's account page. It's a tab of its own so Sign out is always
// one tap away on a phone, where the sidebar footer isn't shown.
export default function CoachSettings() {
  const st = useStore();
  const live = st.mode === 'live';
  const active = st.clients.filter((c) => c.invite === 'joined').length;

  return (
    <Page maxWidth={720}>
      <Title>Settings</Title>

      <Card>
        <H3>Your account</H3>
        {live ? (
          <View>
            <Small>Signed in as</Small>
            <BodyBold>{st.account?.email ?? 'Unknown email'}</BodyBold>
          </View>
        ) : (
          <Body>You're looking at the demo. Nothing here is saved.</Body>
        )}
        <Small>{active} active clients · Founder plan</Small>
        {live ? (
          <Button full variant="danger" icon="logout" title="Sign out" onPress={st.signOut} />
        ) : supabase ? (
          <Button full icon="logout" title="Leave the demo and sign in" onPress={st.signOut} />
        ) : null}
      </Card>

      <Card>
        <H3>Your app</H3>
        <Button full variant="ghost" icon="star" title="Branding" onPress={() => router.navigate('/coach/branding')} />
        <Button full variant="ghost" icon="plus" title="Add client" onPress={() => router.navigate('/coach/clients?add=1')} />
        <Button
          full
          variant="ghost"
          icon="switch"
          title="View client app"
          onPress={() => {
            st.setRole('client');
            router.navigate('/');
          }}
        />
      </Card>
    </Page>
  );
}
