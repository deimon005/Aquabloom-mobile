import { useLocalSearchParams } from 'expo-router';
import { RequireSession } from '../../../../presentation/auth/RequireSession';
import { EstimatesScreen } from '../../../../presentation/scientific/EstimatesScreen';
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
