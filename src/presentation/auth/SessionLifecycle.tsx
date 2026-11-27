import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { useAppServices } from '../shared/services/AppServicesProvider';
import { bindSessionLifecycle } from '../../application/auth/bindSessionLifecycle';

export function SessionLifecycle() {
  const { sessionRefresh } = useAppServices().auth;
  useEffect(() => {
    if (!sessionRefresh || Platform.OS === 'web') return;
    return bindSessionLifecycle(sessionRefresh, AppState);
  }, [sessionRefresh]);
  return null;
}
