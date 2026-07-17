export function isPrismaSchemaMismatchError(error: unknown) {
  const candidate = error as {
    code?: string;
    message?: string;
    meta?: { column?: string; modelName?: string };
  };
  const message = candidate?.message || '';
  const column = candidate?.meta?.column || '';

  return (
    candidate?.code === 'P2022' ||
    message.includes('does not exist in the current database') ||
    column.includes('Withdrawal.rewardId') ||
    column.includes('Withdrawal.rewardClaimId')
  );
}

export function getSafeApiError(
  error: unknown,
  fallbackMessage = 'Internal server error',
  fallbackStatus = 500
) {
  if (isPrismaSchemaMismatchError(error)) {
    return {
      status: 503,
      message:
        'Reward withdrawal records are temporarily unavailable while the database migration completes.',
    };
  }

  const candidate = error as { message?: string; status?: number };
  const status =
    typeof candidate?.status === 'number' && candidate.status >= 400
      ? candidate.status
      : fallbackStatus;

  return {
    status,
    message: status < 500 && candidate?.message ? candidate.message : fallbackMessage,
  };
}
