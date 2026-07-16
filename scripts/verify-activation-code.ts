import { printReadinessReport } from './lib/root-registration-readiness';

printReadinessReport('activation').catch((error) => {
  console.error('Activation-code verification failed:', error);
  process.exitCode = 1;
});
