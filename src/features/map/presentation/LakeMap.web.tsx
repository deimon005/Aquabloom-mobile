import { Link } from 'expo-router';
import { View } from 'react-native';
import { AsyncState } from '../../../components/AsyncState';
import type { LakeMapProps } from '../domain/mapTypes';

export function LakeMap(_props: LakeMapProps) {
  return (
    <View style={{ padding: 24, gap: 16 }}>
      <AsyncState
        kind="empty"
        message="El mapa interactivo está disponible en la aplicación móvil. Puedes consultar los lagos desde el catálogo."
      />
      <Link href="/catalog">Ver lagos</Link>
    </View>
  );
}
