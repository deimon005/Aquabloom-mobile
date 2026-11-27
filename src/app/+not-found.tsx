import { Link } from 'expo-router';
import { Screen } from '../presentation/shared/components/Screen';
export default function NotFound() {
  return (
    <Screen title="Página no encontrada">
      <Link href="/">Volver al inicio</Link>
    </Screen>
  );
}
