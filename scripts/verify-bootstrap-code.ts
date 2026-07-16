import { printReadinessReport } from './lib/root-registration-readiness';

printReadinessReport('bootstrap').catch((error) => {
  console.error('Bootstrap-code verification failed:', error);
  process.exitCode = 1;
});
