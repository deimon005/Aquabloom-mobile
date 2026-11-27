import { Tabs } from 'expo-router';
import { tokens } from '../../presentation/shared/theme/tokens';
import { BrandHeader } from '../../presentation/shared/components/BrandHeader';
import {
  AppIcon,
  type IconName,
} from '../../presentation/shared/components/AppIcon';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        header: () => <BrandHeader />,
        tabBarActiveTintColor: tokens.colors.primary,
        tabBarInactiveTintColor: tokens.colors.muted,
        tabBarActiveBackgroundColor: tokens.colors.primarySoft,
        tabBarItemStyle: {
          borderRadius: 12,
          marginHorizontal: 5,
          marginVertical: 5,
          paddingVertical: 5,
        },
        tabBarStyle: {
          backgroundColor: tokens.colors.surface,
          borderTopColor: tokens.colors.border,
          height: 76,
          paddingTop: 4,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 3 },
        tabBarIcon: ({ color }) => (
          <AppIcon
            size={20}
            color={color}
            name={
              (
                {
                  index: 'grid',
                  catalog: 'lake',
                  map: 'map',
                  profile: 'user',
                } as Record<string, IconName>
              )[route.name] ?? 'grid'
            }
          />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="catalog" options={{ title: 'Catálogo' }} />
      <Tabs.Screen name="map" options={{ title: 'Mapa' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
