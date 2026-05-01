/**
 * Maximum number of co-hosts allowed on stage (excluding the host/creator).
 */
export const MAX_COHOSTS = 3;

/**
 * Count the number of active co-hosts among the given participants.
 *
 * A participant is considered a co-host if they have any of:
 * - `co_host` role
 * - `admin` role
 * - `send-video` capability
 * - `send-audio` capability
 *
 * The host (creator) is always excluded. The local participant is excluded
 * unless they already have co-host privileges.
 *
 * @param participants - Array of Stream Video participants (from `useParticipants()`)
 * @param creatorId    - The user ID of the stream creator/host
 * @param localUserId  - The user ID of the local participant (optional)
 */
export function countCohosts(
    participants: any[],
    creatorId?: string,
    localUserId?: string,
): number {
    return participants.filter((p: any) => {
        // Exclude the host
        if (p.userId === creatorId) return false;

        // Exclude the local participant if they are not already a co-host
        if (p.userId === localUserId) {
            const isAlreadyCohost =
                p.roles?.includes('co_host') ||
                p.roles?.includes('admin') ||
                p.capabilities?.includes('send-video') ||
                p.capabilities?.includes('send-audio');
            if (!isAlreadyCohost) return false;
        }

        // Count as co-host if they have co-host/admin role or send capabilities
        return (
            p.roles?.includes('co_host') ||
            p.roles?.includes('admin') ||
            p.capabilities?.includes('send-video') ||
            p.capabilities?.includes('send-audio')
        );
    }).length;
}