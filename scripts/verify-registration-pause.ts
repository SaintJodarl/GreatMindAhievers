import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  getRegistrationPauseDecision,
  isRegistrationPaused,
  runWhenRegistrationOpen,
} from '../src/lib/registration-pause';

let assertions = 0;

function check(name: string, condition: boolean) {
  assertions += 1;
  assert.equal(condition, true, name);
}

async function main() {
  check(
    'registration is paused only when value is exactly true',
    isRegistrationPaused({ REGISTRATION_PAUSED: 'true' })
  );
  check(
    'registration is not paused when value is TRUE',
    !isRegistrationPaused({ REGISTRATION_PAUSED: 'TRUE' })
  );
  check('registration is not paused when value is absent', !isRegistrationPaused({}));

  const decision = getRegistrationPauseDecision({ REGISTRATION_PAUSED: 'true' });
  check('paused decision returns HTTP 503', decision?.status === 503);
  check('paused decision returns stable code', decision?.code === 'REGISTRATION_PAUSED');

  let writeCount = 0;
  const pausedResult = await runWhenRegistrationOpen(
    () => {
      writeCount += 1;
      return 'wrote';
    },
    { REGISTRATION_PAUSED: 'true' }
  );
  check('paused guard does not invoke write operation', writeCount === 0);
  check('paused guard reports paused result', pausedResult.paused);

  const openResult = await runWhenRegistrationOpen(
    () => {
      writeCount += 1;
      return 'opened';
    },
    { REGISTRATION_PAUSED: 'false' }
  );
  check('open guard invokes operation once', writeCount === 1);
  check(
    'open guard returns operation result',
    !openResult.paused && openResult.result === 'opened'
  );

  const routeSource = readFileSync('src/app/api/auth/register/route.ts', 'utf8');
  const pauseCheckIndex = routeSource.indexOf('getRegistrationPauseDecision()');
  const bodyParseIndex = routeSource.indexOf('await req.json()');
  const firstPrismaIndex = routeSource.indexOf('prisma.');
  check('registration pause check exists in register route', pauseCheckIndex > -1);
  check('pause check runs before request parsing', pauseCheckIndex < bodyParseIndex);
  check('pause check runs before Prisma access', pauseCheckIndex < firstPrismaIndex);

  console.log(`Registration pause verification passed (${assertions} assertions).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
