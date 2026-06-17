import { backfillPlacements } from '@/lib/binary-placement/backfill';
import { logger } from '@/lib/binary-placement/logger';

async function main() {
  logger.info('Starting binary placement backfill...');
  const result = await backfillPlacements();
  
  console.log('\n=== BACKFILL SUMMARY ===');
  console.log(`Processed: ${result.processed}`);
  console.log(`Placed: ${result.placed}`);
  console.log(`Skipped: ${result.skipped}`);
  console.log(`Errors: ${result.errors.length}`);
  
  if (result.errors.length > 0) {
    console.log('\nErrors:');
    result.errors.forEach(e => console.log(`  ${e.userId}: ${e.error}`));
    process.exit(1);
  }
  
  logger.info('Backfill completed successfully');
}

main().catch((error) => {
  logger.error('Backfill failed:', error);
  process.exit(1);
});