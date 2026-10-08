import { router, Slot } from 'expo-router';
import { useEffect } from 'react';
import { Shell } from '@/components/Shell';
import { BodyBold, Button, Card, Small } from '@/components/ui';
import { useStore } from '@/data/store';

export default function TrainerLayout() {
  const st = useStore();
  useEffect(() => st.setRole('trainer'), [st.setRole]);
  const unread = st.pain.filter((p) => p.status === 'new').length + st.logs.filter((l) => l.checkIn && !l.seenByTrainer).length;
  const active = st.clients.filter((c) => c.invite === 'joined').length;
  return (
    <Shell
      subtitle="Coach"
      items={[
        { href: '/coach', label: 'Inbox', icon: 'inbox', badge: unread || undefined },
        { href: '/coach/clients', label: 'Clients', icon: 'users', match: (p) => p.startsWith('/coach/clients') },
        { href: '/coach/sessions', label: 'Sessions', icon: 'grid', match: (p) => p.startsWith('/coach/sessions') },
      ]}
      footer={
        <Card tone="soft" style={{ padding: 14, gap: 8 }}>
          <BodyBold>{active} active clients</BodyBold>
          <Small>Founder plan</Small>
          <Button small icon="plus" title="Add client" onPress={() => router.navigate('/coach/clients?add=1')} />
          <Button small variant="ghost" icon="switch" title="View client app" onPress={() => router.navigate('/')} />
        </Card>
      }
    >
      <Slot />
    </Shell>
  );
}
