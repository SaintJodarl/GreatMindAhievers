import { printReadinessReport } from './lib/root-registration-readiness';

printReadinessReport('integrity').catch((error) => {
  console.error('Binary-integrity verification failed:', error);
  process.exitCode = 1;
});
