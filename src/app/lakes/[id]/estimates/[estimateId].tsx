import { useLocalSearchParams } from 'expo-router';
import { RequireSession } from '../../../../presentation/auth/RequireSession';
import { EstimateScreen } from '../../../../presentation/scientific/EstimateScreen';
export default function EstimateRoute() {
  const params = useLocalSearchParams<{
    id: string;
    estimateId: string;
    demo?: string;
  }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const estimateId =
    typeof params.estimateId === 'string' ? params.estimateId : '';
  return (
    <RequireSession returnTo={`/lakes/${id}/estimates/${estimateId}`}>
      <EstimateScreen
        lakeId={id}
        estimateId={estimateId}
        demo={typeof params.demo === 'string' ? params.demo : undefined}
      />
    </RequireSession>
  );
}
