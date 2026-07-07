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
      {/* Image Placeholder or Actual Image */}
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
          <span className="relative z-10 mb-1 text-sm font-semibold text-muted-foreground">Reward image coming soon</span>
          <span className="relative z-10 text-xs text-muted-foreground/70">{title}</span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-6">
        <h3 className="mb-4 text-xl font-bold text-foreground sm:text-2xl">{title}</h3>

        <p className="mb-6 text-sm leading-relaxed text-secondary-foreground">
          {qualification}
        </p>

        {totalAward && (
          <div className="mb-6 inline-block rounded-lg bg-secondary px-4 py-2 font-mono text-lg font-semibold text-foreground">
            Total Award: <span style={{ color: accentColor }}>{totalAward}</span>
          </div>
        )}

        <div className="mt-auto border-t border-border pt-5">
          <h4 className="mb-3 text-sm font-semibold text-foreground">Rewards included:</h4>
          <ul className="space-y-3">
            {rewards.map((reward, i) => (
              <li key={i} className="flex items-start gap-3">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: accentColor }}
                  aria-hidden="true"
                />
                <span className="text-sm text-secondary-foreground">{reward}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function CompensationPlanSection() {
  const stages = [
    {
      title: 'EMERALD – STAGE (1)',
      qualification:
        'To complete this stage, you need 14 persons who just completed their starter level under you to join you here.',
      rewards: [
        '1 carton of Noodles',
        '1 roll of milk',
        '1 roll of Milo',
        '1 pack of sugar',
        '5kg Garri',
        '5kg Beans',
        'Rice 10kg',
        '2 Liters of Palm Oil',
        'Cash ₦10,000',
      ],
      accentColor: '#10b981', // Emerald green
      imageUrl: '/assets/images/Compensation Plan/EMERALD – STAGE (1).png',
    },
    {
      title: 'SILVER – STAGE (2)',
      qualification:
        'To complete this stage, you need 14 persons who just completed their Stage 1 level under you to join you here.',
      rewards: [
        '1 carton of spaghetti',
        '2 tins of tomatoes',
        '1 packet of sugar',
        '2 rolls of milk and Milo',
        'Health care product worth ₦11,000',
        'Cash ₦20,000',
      ],
      accentColor: '#94a3b8', // Silver/Slate
      imageUrl: '/assets/images/Compensation Plan/SILVER – STAGE (2).png',
    },
    {
      title: 'GOLD – STAGE (3)',
      qualification:
        'To complete this stage, you need 14 persons who just completed their Stage 2 level under you to join you here.',
      rewards: [
        '1 pack of Golden Morn',
        'Milk refill',
        'Carton of noodles',
        '½ bag of rice',
        '½ carton of spaghetti',
        '1 big custard',
        '½ carton of tin tomatoes',
        'Maggi, 1 pack',
        'Pack of sugar',
        '1 liter of groundnut oil',
        'Cash ₦100,000',
      ],
      accentColor: '#eab308', // Gold/Yellow
    },
    {
      title: 'JASPER – STAGE (4)',
      qualification:
        'To complete this stage, you need 14 persons who just completed their Stage 3 level under you to join you here.',
      totalAward: '₦3,800,000',
      rewards: [
        'Cash ₦1,000,000',
        'Foodstuffs worth ₦200,000',
        'Health care product worth ₦100,000',
        'Children school fee support ₦250,000',
        'Loan of ₦250,000',
        '1st car award worth ₦2,000,000',
      ],
      accentColor: '#ef4444', // Jasper/Red
    },
    {
      title: 'SAPPHIRE – STAGE (5)',
      qualification:
        'To complete this stage, you need 14 persons who just completed their Stage 4 level under you to join you here.',
      totalAward: '₦8,800,000',
      rewards: [
        'Cash ₦4,000,000',
        'Foodstuffs worth ₦400,000',
        'Android phone worth ₦200,000',
        'Health care product worth ₦50,000',
        'Refrigerator worth ₦150,000',
        'Loan of ₦1,000,000',
        '2nd car award worth ₦3,000,000',
      ],
      accentColor: '#3b82f6', // Sapphire/Blue
    },
    {
      title: 'DIAMOND – STAGE (6)',
      qualification:
        'To complete this stage, you need 14 persons who just completed their Stage 5 level under you to join you here.',
      totalAward: '₦30,000,000',
      rewards: [
        'Brand new car worth ₦8,000,000',
        'House award worth ₦10,000,000',
        'Foodstuffs worth ₦500,000',
        'Electronics worth ₦200,000',
        'Children school fees worth ₦300,000',
        'Health product worth ₦300,000',
        'Send-off party worth ₦1,000,000',
        'International trip',
        'Cash ₦6,000,000',
      ],
      accentColor: '#38bdf8', // Diamond/Sky Blue
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
            Progress through our structured stages and unlock increasing rewards, from vital food supplies to significant financial empowerment.
          </p>
        </div>

        {/* Starter Level Card */}
        <div className="mx-auto mb-16 flex max-w-3xl flex-col overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 shadow-sm sm:flex-row">
          {/* Starter Image Placeholder */}
          <div className="relative flex w-full flex-col items-center justify-center border-b border-primary/20 bg-primary/10 p-6 text-center sm:w-1/3 sm:border-b-0 sm:border-r aspect-video sm:aspect-auto">
            <div className="absolute inset-0 bg-primary/5" />
            <span className="relative z-10 mb-1 text-sm font-semibold text-primary/80">Reward image coming soon</span>
            <span className="relative z-10 text-xs text-primary/60">STARTER LEVEL REWARD</span>
          </div>
          
          <div className="flex flex-1 flex-col justify-center p-6 sm:p-8">
            <h3 className="mb-3 text-xl font-bold text-foreground">STARTER LEVEL REWARD</h3>
            <p className="text-base leading-relaxed text-secondary-foreground">
              Once the one-time registration fee of <strong className="text-foreground">₦7,000</strong> is made, you automatically become a member of GMA and you are then required to introduce two persons successfully before you start earning your reward.
            </p>
          </div>
        </div>

        {/* Stages Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stages.map((stage) => (
            <RewardCard key={stage.title} {...stage} />
          ))}
        </div>
      </div>
    </section>
  );
}
