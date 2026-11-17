import { Redirect, router, Slot } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { Shell } from '@/components/Shell';
import { Button, Card, Small, BodyBold } from '@/components/ui';
import { useGoalReminder } from '@/data/reminder';
import { useStore } from '@/data/store';

export default function ClientLayout() {
  const { setRole, mode, role, account, clients, clientId } = useStore();
  const coachHome = mode === 'live' && account?.trainer && role === 'trainer';
  useEffect(() => {
    if (!coachHome) setRole('client');
  }, [setRole, coachHome]);
  // Only on a client's own phone, not when a trainer previews the app.
  useGoalReminder(clients.find((x) => x.id === clientId)?.dailyGoals, mode === 'live' && !account?.trainer);
  // A trainer signing in lands on their dashboard, not the client app.
  if (coachHome) return <Redirect href="/coach" />;
  return (
    <Shell
      subtitle="with Hogan"
      items={[
        { href: '/', label: 'Today', icon: 'home' },
        { href: '/sessions', label: 'My sessions', icon: 'grid', match: (p) => p.startsWith('/sessions') },
        { href: '/community', label: 'Community', icon: 'users' },
        { href: '/diary', label: 'Diary', icon: 'book' },
        { href: '/me', label: 'Me', icon: 'user' },
      ]}
      footer={
        <Card tone="soft" style={{ padding: 14, gap: 8 }}>
          <View>
            <BodyBold>Your trainer</BodyBold>
            <Small>Hogan · Winchester</Small>
          </View>
          <Button small variant="outline" icon="chat" title="Message Hogan" onPress={() => router.navigate('/diary')} />
        </Card>
      }
    >
      <Slot />
    </Shell>
  );
}
