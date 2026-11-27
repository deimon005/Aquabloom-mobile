import { useLocalSearchParams } from 'expo-router';
import { RequireSession } from '../../../presentation/auth/RequireSession';
import { ObservationScreen } from '../../../presentation/observations/ObservationScreen';

export default function Observations() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const lakeId = typeof id === 'string' ? id : '';
  return (
    <RequireSession returnTo={`/lakes/${lakeId}/observations`}>
      <ObservationScreen key={lakeId} lakeId={lakeId} />
    </RequireSession>
  );
}
