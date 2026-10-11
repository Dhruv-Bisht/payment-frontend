import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { ApiError } from '../../lib/client';

export type HealthState = 'UP' | 'DOWN' | 'UNREACHABLE';

/** Public liveness check (/actuator/health). Works signed out, so the home page can show live status. */
export function useHealth() {
  return useQuery<HealthState>({
    queryKey: ['health'],
    queryFn: async () => {
      try {
        const h = await api.health();
        return h.status === 'UP' ? 'UP' : 'DOWN';
      } catch (e) {
        return e instanceof ApiError && e.status === 503 ? 'DOWN' : 'UNREACHABLE';
      }
    },
    refetchInterval: 30_000,
    retry: false,
  });
}
