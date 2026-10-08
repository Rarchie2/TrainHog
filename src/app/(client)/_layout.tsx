import { router, Slot } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { Shell } from '@/components/Shell';
import { Button, Card, Small, BodyBold } from '@/components/ui';
import { useStore } from '@/data/store';

export default function ClientLayout() {
  const { setRole } = useStore();
  useEffect(() => setRole('client'), [setRole]);
  return (
    <Shell
      subtitle="with Hogan"
      items={[
        { href: '/', label: 'Today', icon: 'home' },
        { href: '/sessions', label: 'My sessions', icon: 'grid', match: (p) => p.startsWith('/sessions') },
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
