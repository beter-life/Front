import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth, useServices } from '../hooks/use-services';
import type { Me, ProfileInput } from './schema';
export function useMe() {
  const { api } = useServices(); const { session } = useAuth();
  return useQuery({ queryKey: ['private', 'me', session?.user.id], queryFn: ({ signal }) => api.getMe(signal), enabled: !!session });
}
export function useUpdateProfile() {
  const { api, queryClient, auth } = useServices(); const { session } = useAuth();
  const owner = session?.user.id;
  return useMutation({ mutationFn: (input: ProfileInput) => api.updateProfile(input), onSuccess: (profile) => {
    // A response from a former session must never repopulate private cache.
    if (!owner || auth.getSnapshot().session?.user.id !== owner) return;
    queryClient.setQueryData<Me>(['private', 'me', owner], { identity: { authUserId: owner }, profile });
  } });
}
