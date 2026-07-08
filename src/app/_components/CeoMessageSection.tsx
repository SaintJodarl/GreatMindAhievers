'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

export function CeoMessageSection() {
  const imageRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const currentRef = imageRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(currentRef);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  return (
    <section id="ceo-message" className="scroll-mt-24 py-16 sm:py-20 lg:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Text and Audio Container */}
          <div className="order-2 lg:order-1 space-y-8">
            <div className="mb-10 max-w-3xl sm:mb-12 mx-0 text-left">
              <span className="text-sm font-bold uppercase tracking-wider text-primary">
                A Message from Our CEO
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                Apostle Dr. Honorable Blessing Makata
              </h2>
              <p className="mt-4 text-base leading-relaxed text-secondary-foreground sm:text-lg">
                Listen to our CEO share the vision behind Great Mind Achievers, the strong community
                we are building together, and why every member matters in our shared journey toward
                growth, empowerment and collective success.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-foreground">
                Listen to a personal message from our CEO
              </h3>
              <audio controls preload="metadata" className="w-full">
                <source src="/assets/audio/ceo-message/ceo-message.aac" />
                Your browser does not support the audio element.
              </audio>
            </div>
          </div>

          {/* Image Container with Fade */}
          <div ref={imageRef} className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[560px] overflow-hidden rounded-3xl shadow-2xl">
              {/* Fade effect is applied to the image wrapper when it enters the viewport */}
              <div
                className={`transition-opacity duration-[1500ms] ease-out ${
                  isVisible ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <Image
                  src="/assets/images/Apostle%20Blessing%20Makata.jpg"
                  alt="Apostle Blessing Makata - CEO of Great Mind Achievers"
                  width={560}
                  height={750}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="w-full h-auto object-cover object-center"
                  priority
                />
                <div
                  className="absolute inset-0 bg-black/5 pointer-events-none"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
