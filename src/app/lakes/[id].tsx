import { useLocalSearchParams } from 'expo-router';
import { LakeDetailScreen } from '../../features/lakes/presentation/LakeDetailScreen';
export default function LakeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LakeDetailScreen id={typeof id === 'string' ? id : ''} />;
}
