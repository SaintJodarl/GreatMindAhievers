import { printReadinessReport } from './lib/root-registration-readiness';

printReadinessReport().catch((error) => {
  console.error('Root registration readiness verification failed:', error);
  process.exitCode = 1;
});
