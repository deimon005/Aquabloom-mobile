import { useLocalSearchParams } from 'expo-router';
import { StationScreen } from '../../../../presentation/lakes/StationScreen';
export default function StationRoute() {
  const { id, stationId } = useLocalSearchParams<{
    id: string;
    stationId: string;
  }>();
  return (
    <StationScreen
      lakeId={typeof id === 'string' ? id : ''}
      stationId={typeof stationId === 'string' ? stationId : ''}
    />
  );
}
