export const REGISTRATION_FEE_PER_ACTIVE_MEMBER = 7000;

export function calculateRegistrationRevenue(activeMemberCount: number) {
  return activeMemberCount * REGISTRATION_FEE_PER_ACTIVE_MEMBER;
}
