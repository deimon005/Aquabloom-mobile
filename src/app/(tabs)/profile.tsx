import { ProfileScreen } from '../../features/auth/presentation/ProfileScreen';
import { RequireSession } from '../../features/auth/presentation/RequireSession';

export default function Profile() {
  return (
    <RequireSession>
      <ProfileScreen />
    </RequireSession>
  );
}
