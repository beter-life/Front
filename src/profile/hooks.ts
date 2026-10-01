import { useMutation, useQuery } from '@tanstack/react-query';
import { useServices } from '../hooks/use-services';
import { useAuthV2 } from '../auth-v2/hooks';
import type { Me, ProfileInput } from './schema';
export function useMe() {
  const { api } = useServices(); const { session } = useAuthV2();
  return useQuery({ queryKey: ['private', 'me', session?.user.id], queryFn: ({ signal }) => api.getMe(signal), enabled: !!session });
}
export function useUpdateProfile() {
  const { api, queryClient } = useServices(); const { session, store } = useAuthV2();
  const owner = session?.user.id;
  const token = session?.access_token;
  return useMutation({ mutationFn: (input: ProfileInput) => api.updateProfile(input), onSuccess: (profile) => {
    // A response from a former session must never repopulate private cache.
    if (!owner || store.getSnapshot().session?.user.id !== owner || store.getSnapshot().session?.access_token !== token) return;
    queryClient.setQueryData<Me>(['private', 'me', owner], { identity: { authUserId: owner }, profile });
  } });
}
