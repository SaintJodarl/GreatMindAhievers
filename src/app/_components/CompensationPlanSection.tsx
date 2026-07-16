import React from 'react';
import { Check } from 'lucide-react';
import Image from 'next/image';

interface RewardCardProps {
  title: string;
  imageUrl?: string;
  qualification: string;
  totalAward?: string;
  rewards: string[];
  accentColor: string;
}

function RewardCard({
  title,
  imageUrl,
  qualification,
  totalAward,
  rewards,
  accentColor,
}: RewardCardProps) {
  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1"
      style={{
        borderTopWidth: '4px',
        borderTopColor: accentColor,
      }}
    >
      {imageUrl ? (
        <div className="relative aspect-video w-full overflow-hidden border-b border-border bg-muted">
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover object-center"
          />
        </div>
      ) : (
        <div className="relative flex aspect-video w-full flex-col items-center justify-center border-b border-border bg-muted p-4 text-center">
          <div className="absolute inset-0 bg-black/5" />
          <span className="relative z-10 mb-1 text-sm font-semibold text-muted-foreground">
            Reward image coming soon
          </span>
          <span className="relative z-10 text-xs text-muted-foreground/70">{title}</span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-6">
        <h3 className="mb-4 text-xl font-bold text-foreground sm:text-2xl">{title}</h3>

        <p className="mb-6 text-sm leading-relaxed text-secondary-foreground">{qualification}</p>

        {totalAward && (
          <div className="mb-6 inline-block rounded-lg bg-secondary px-4 py-2 font-mono text-lg font-semibold text-foreground">
            Total Award: <span style={{ color: accentColor }}>{totalAward}</span>
          </div>
        )}

        <div className="mt-auto border-t border-border pt-5">
          <h4 className="mb-3 text-sm font-semibold text-foreground">Reward package:</h4>
          <ul className="space-y-3">
            {rewards.map((reward, i) => {
              const isOr = reward.trim().toUpperCase() === 'OR';
              return (
                <li
                  key={i}
                  className={`flex ${isOr ? 'justify-center items-center py-1' : 'items-start gap-3'}`}
                >
                  {!isOr && (
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0"
                      style={{ color: accentColor }}
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={`text-sm ${isOr ? 'font-bold text-muted-foreground bg-muted px-4 py-1 rounded-full text-xs tracking-widest' : 'text-secondary-foreground'}`}
                  >
                    {isOr ? 'OR' : reward}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function CompensationPlanSection() {
  const stages = [
    {
      title: 'Emerald \u2014 Stage 1',
      qualification:
        'Qualify with the first 14 binary-tree positions at Starter Stage \u2014 Entry Stage or higher: 7 left and 7 right.',
      rewards: [
        '1 carton of noodles',
        '1 roll of milk',
        '1 roll of Milo',
        '1 pack of sugar',
        'Cash \u20a610,000',
        'OR',
        '5 kg garri',
        '5 kg beans',
        '2 litres palm oil',
        'OR',
        '10 kg rice',
        'Cash \u20a610,000',
      ],
      accentColor: '#10b981',
      imageUrl: '/assets/images/Compensation Plan/EMERALD \u2013 STAGE (1).png',
    },
    {
      title: 'Silver \u2014 Stage 2',
      qualification:
        'Qualify with 14 unique genuine descendants at Emerald \u2014 Stage 1 or higher.',
      rewards: [
        '1 carton spaghetti',
        '2 tins tomatoes',
        '1 packet sugar',
        '2 rolls of milk and Milo',
        'Cash \u20a620,000',
        'Healthcare products worth \u20a611,000',
      ],
      accentColor: '#94a3b8',
      imageUrl: '/assets/images/Compensation Plan/SILVER \u2013 STAGE (2).png',
    },
    {
      title: 'Gold \u2014 Stage 3',
      qualification:
        'Qualify with 14 unique genuine descendants at Silver \u2014 Stage 2 or higher.',
      rewards: [
        'Golden Morn',
        'Milk refill',
        'Carton of noodles',
        'Half bag of rice',
        'Half carton of spaghetti',
        'Large custard',
        'Half carton of tinned tomatoes',
        'Seasoning cubes',
        'Pack of sugar',
        '1 litre groundnut oil',
        'Cash \u20a6100,000',
      ],
      accentColor: '#eab308',
    },
    {
      title: 'Jasper \u2014 Stage 4',
      qualification: 'Qualify with 14 unique genuine descendants at Gold \u2014 Stage 3 or higher.',
      totalAward: '\u20a63,800,000',
      rewards: [
        'Cash \u20a61,000,000',
        'Foodstuffs worth \u20a6200,000',
        'Healthcare products worth \u20a6100,000',
        'Children school-fee support worth \u20a6250,000',
        'Repayable loan of \u20a6250,000 at 1% interest',
        'First car award worth \u20a62,000,000',
      ],
      accentColor: '#ef4444',
    },
    {
      title: 'Sapphire \u2014 Stage 5',
      qualification:
        'Qualify with 14 unique genuine descendants at Jasper \u2014 Stage 4 or higher.',
      totalAward: '\u20a68,800,000',
      rewards: [
        'Cash \u20a64,000,000',
        'Foodstuffs worth \u20a6400,000',
        'Android phone worth \u20a6200,000',
        'Second car award worth \u20a63,000,000',
        'Healthcare products worth \u20a650,000',
        'Refrigerator worth \u20a6150,000',
        'Repayable loan of \u20a61,000,000 at 1% interest',
      ],
      accentColor: '#3b82f6',
    },
    {
      title: 'Diamond \u2014 Stage 6 \u2014 Final Stage',
      qualification:
        'Qualify with 14 unique genuine descendants at Sapphire \u2014 Stage 5 or higher.',
      totalAward: '\u20a630,000,000',
      rewards: [
        'Brand-new car worth \u20a68,000,000',
        'House award worth \u20a610,000,000',
        'Foodstuffs worth \u20a6500,000',
        'Electronics worth \u20a6200,000',
        'Children school-fee support worth \u20a6300,000',
        'Healthcare products worth \u20a6300,000',
        'Cash \u20a66,000,000',
        'Send-off celebration worth \u20a61,000,000',
        'Fixed international trip',
      ],
      accentColor: '#38bdf8',
    },
  ];

  return (
    <section id="compensation-plan" className="scroll-mt-24 bg-background py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold text-accent">Compensation Plan</p>
          <h2 className="text-balance text-3xl font-bold leading-tight text-foreground sm:text-4xl">
            GMA FOODCARE/INITIATIVE FOR ALL COMPENSATION PLAN
          </h2>
          <p className="mt-4 text-base leading-relaxed text-secondary-foreground sm:text-lg">
            Progress through approved compensation stages while keeping every member permanently in
            their original genealogy position.
          </p>
        </div>

        <div className="mx-auto mb-16 flex max-w-3xl flex-col overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 shadow-sm sm:flex-row">
          <div className="relative flex w-full flex-col items-center justify-center border-b border-primary/20 bg-primary/10 p-6 text-center sm:w-1/3 sm:border-b-0 sm:border-r aspect-video sm:aspect-auto">
            <div className="absolute inset-0 bg-primary/5" />
            <span className="relative z-10 mb-1 text-sm font-semibold text-primary/80">
              Entry qualification
            </span>
            <span className="relative z-10 text-xs text-primary/60">STARTER ENTRY STAGE</span>
          </div>

          <div className="flex flex-1 flex-col justify-center p-6 sm:p-8">
            <h3 className="mb-3 text-xl font-bold text-foreground">
              Starter Stage \u2014 Entry Stage
            </h3>
            <p className="text-base leading-relaxed text-secondary-foreground">
              After the one-time registration fee of{' '}
              <strong className="text-foreground">\u20a67,000</strong>, a registered active member
              is placed at Starter. Starter is completed by personally sponsoring at least one
              active direct member in the left binary leg and at least one active direct member in
              the right binary leg. No separate Starter reward has been specified.
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stages.map((stage) => (
            <RewardCard key={stage.title} {...stage} />
          ))}
        </div>
      </div>
    </section>
  );
}
