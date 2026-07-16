import { printReadinessReport } from './lib/root-registration-readiness';

printReadinessReport('qualification').catch((error) => {
  console.error('Stage-qualification verification failed:', error);
  process.exitCode = 1;
});
