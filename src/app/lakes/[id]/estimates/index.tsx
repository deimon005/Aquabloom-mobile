import { useLocalSearchParams } from 'expo-router';
import { RequireSession } from '../../../../features/auth/RequireSession';
import { EstimatesScreen } from '../../../../features/scientific/presentation/EstimatesScreen';
export default function EstimatesRoute() {
  const params = useLocalSearchParams<{ id: string; demo?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  return (
    <RequireSession returnTo={`/lakes/${id}/estimates`}>
      <EstimatesScreen
        lakeId={id}
        demo={typeof params.demo === 'string' ? params.demo : undefined}
      />
    </RequireSession>
  );
}
