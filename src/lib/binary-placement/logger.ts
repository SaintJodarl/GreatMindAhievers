export const logger = {
  warn: (...args: unknown[]) => console.warn('[PLACEMENT]', new Date().toISOString(), ...args),
  error: (...args: unknown[]) => console.error('[PLACEMENT]', new Date().toISOString(), ...args),
  info: (...args: unknown[]) => console.log('[PLACEMENT]', new Date().toISOString(), ...args),
};
