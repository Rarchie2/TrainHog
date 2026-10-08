import { router, usePathname } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_NAME } from '@/config';
import { fonts, radius, TOUCH } from '@/theme';
import { Icon, type IconName } from './Icon';
import { Mark, Small, useLayout, useUI } from './ui';

export type NavItem = { href: string; label: string; icon: IconName; badge?: number; match?: (path: string) => boolean };

// One navigation, three shapes: bottom tabs on phone, a side rail on iPad,
// and a full sidebar on laptop. New features add an item here and appear
// on every device at once.
export function Shell({ items, children, subtitle, footer }: {
  items: NavItem[];
  children: React.ReactNode;
  subtitle?: string;
  footer?: React.ReactNode;
}) {
  const { size } = useLayout();
  const { c, k } = useUI();
  const insets = useSafeAreaInsets();
  const path = usePathname();
  const isOn = (it: NavItem) => (it.match ? it.match(path) : path === it.href);

  const go = (href: string) => router.navigate(href as never);

  if (size === 'compact') {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
        <View style={{ flex: 1 }}>{children}</View>
        <View
          accessibilityRole="tablist"
          style={{ flexDirection: 'row', backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.line, paddingBottom: Math.max(insets.bottom, 8), paddingTop: 6, paddingHorizontal: 4 }}
        >
          {items.map((it) => {
            const on = isOn(it);
            return (
              <Pressable
                key={it.href}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={it.label}
                onPress={() => go(it.href)}
                style={{ flex: 1, minHeight: 56 * k, alignItems: 'center', justifyContent: 'center', gap: 3 }}
              >
                <View>
                  <Icon name={it.icon} size={Math.round(24 * k)} color={on ? c.brand : c.muted} />
                  {it.badge ? <Badge n={it.badge} /> : null}
                </View>
                <Text style={{ fontFamily: fonts.bold, fontSize: Math.round(12.5 * k), color: on ? c.brand : c.muted }} numberOfLines={1}>
                  {it.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  const wide = size === 'wide';
  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: c.bg, paddingTop: insets.top }}>
      <View
        accessibilityRole="tablist"
        style={{
          width: wide ? 264 : 100,
          backgroundColor: c.surface,
          borderRightWidth: 1,
          borderRightColor: c.line,
          paddingVertical: 20,
          paddingHorizontal: wide ? 16 : 10,
          gap: 6,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18, alignSelf: wide ? 'flex-start' : 'center', paddingHorizontal: wide ? 8 : 0 }}>
          <Mark size={38} />
          {wide ? (
            <View>
              <Text style={{ fontFamily: fonts.display, fontSize: 18, color: c.ink }}>{APP_NAME}</Text>
              {subtitle ? <Small>{subtitle}</Small> : null}
            </View>
          ) : null}
        </View>
        {items.map((it) => {
          const on = isOn(it);
          return (
            <Pressable
              key={it.href}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={it.label}
              onPress={() => go(it.href)}
              style={(state) => ({
                minHeight: wide ? TOUCH : 64,
                borderRadius: radius.md,
                backgroundColor: on ? c.brandSoft : (state as { hovered?: boolean }).hovered ? c.surface2 : 'transparent',
                flexDirection: wide ? 'row' : 'column',
                alignItems: 'center',
                justifyContent: wide ? 'flex-start' : 'center',
                gap: wide ? 12 : 4,
                paddingHorizontal: wide ? 14 : 4,
              })}
            >
              <View>
                <Icon name={it.icon} size={24} color={on ? c.brand : c.muted} />
                {!wide && it.badge ? <Badge n={it.badge} /> : null}
              </View>
              <Text style={{ fontFamily: fonts.bold, fontSize: wide ? 16 : 12.5, color: on ? c.brand : c.ink, textAlign: 'center' }}>{it.label}</Text>
              {wide && it.badge ? (
                <View style={{ marginLeft: 'auto', backgroundColor: c.bad, borderRadius: 11, minWidth: 22, height: 22, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontFamily: fonts.heavy, fontSize: 12 }}>{it.badge}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
        {wide && footer ? <View style={{ marginTop: 'auto' }}>{footer}</View> : null}
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

function Badge({ n }: { n: number }) {
  const { c } = useUI();
  return (
    <View style={{ position: 'absolute', top: -5, right: -10, backgroundColor: c.bad, borderRadius: 9, minWidth: 18, height: 18, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontFamily: fonts.heavy, fontSize: 11 }}>{n}</Text>
    </View>
  );
}
