import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { MobileTopBar, SessionCard } from '@/components/ClientBits';
import { Icon } from '@/components/Icon';
import { Body, Chip, CATEGORY_ICON, Grid, H3, IconBadge, Page, Small, Title, useLayout, useUI } from '@/components/ui';
import { useClientData } from '@/data/selectors';
import { useMe } from '@/data/store';
import type { Category } from '@/data/types';
import { fonts, radius } from '@/theme';

export default function Sessions() {
  const me = useMe();
  const d = useClientData(me.id);
  const { c, k } = useUI();
  const { size } = useLayout();
  const params = useLocalSearchParams<{ category?: string }>();
  const [filter, setFilter] = useState<string>(params.category ?? 'All');
  const [q, setQ] = useState('');

  const shown = d.mySessions.filter(
    (x) =>
      (filter === 'All' || (filter === 'Favourites' ? x.assignment.favourite : x.session.category === filter)) &&
      (!q || x.session.name.toLowerCase().includes(q.toLowerCase())),
  );
  const groups = Array.from(
    shown.reduce((m, x) => m.set(x.session.category, [...(m.get(x.session.category) ?? []), x]), new Map<Category, typeof shown>()),
  );

  return (
    <Page>
      <MobileTopBar initials={me.initials} />
      <View style={{ gap: 4 }}>
        <Title>My sessions</Title>
        <Small>Only the sessions Hogan has set for you</Small>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, borderRadius: radius.pill, paddingHorizontal: 16, minHeight: 50 }}>
        <Icon name="search" size={20} color={c.muted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search sessions"
          placeholderTextColor={c.muted}
          accessibilityLabel="Search sessions"
          style={{ flex: 1, fontFamily: fonts.medium, fontSize: Math.round(17 * k), color: c.ink, minHeight: 48 }}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {['All', 'Favourites', ...d.categories.map(([cat]) => cat)].map((f) => (
          <Chip key={f} label={f} on={filter === f} onPress={() => setFilter(f)} icon={f === 'Favourites' ? 'star' : undefined} />
        ))}
      </ScrollView>
      {groups.length === 0 ? (
        <Body>Nothing matches that. Try another word or tap All.</Body>
      ) : (
        groups.map(([cat, items]) => (
          <View key={cat} style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <IconBadge name={CATEGORY_ICON[cat]} size={34} />
              <H3>{cat}</H3>
              <Small>{items.length}</Small>
            </View>
            <Grid min={size === 'compact' ? 300 : 380}>
              {items.map((x) => (
                <SessionCard key={x.assignment.id} session={x.session} assignment={x.assignment} />
              ))}
            </Grid>
          </View>
        ))
      )}
    </Page>
  );
}
