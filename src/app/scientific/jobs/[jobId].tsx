import { useLocalSearchParams } from 'expo-router';
import { RequireSession } from '../../../features/auth/presentation/RequireSession';
import { ScientificJobScreen } from '../../../features/scientific/presentation/ScientificJobScreen';
export default function JobRoute() {
  const params = useLocalSearchParams<{ jobId: string; demo?: string }>();
  const jobId = typeof params.jobId === 'string' ? params.jobId : '';
  return (
    <RequireSession returnTo={`/scientific/jobs/${jobId}`}>
      <ScientificJobScreen
        jobId={jobId}
        demo={typeof params.demo === 'string' ? params.demo : undefined}
      />
    </RequireSession>
  );
}
