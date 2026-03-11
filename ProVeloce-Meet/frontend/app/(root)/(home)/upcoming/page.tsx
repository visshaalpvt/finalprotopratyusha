'use client';

import CallList from '@/components/CallList';
import { ScrollAnimation } from '@/lib/animations';

const UpcomingPage = () => {
  return (
    <section className="flex size-full flex-col gap-6 sm:gap-8 md:gap-10 text-black p-4 sm:p-6">
      <ScrollAnimation variant="fadeUp">
        <h1 className="text-2xl sm:text-3xl font-bold text-black">Upcoming Meeting</h1>
      </ScrollAnimation>

      <ScrollAnimation variant="fadeUp" delay={0.1}>
      <CallList type="upcoming" />
      </ScrollAnimation>
    </section>
  );
};

export default UpcomingPage;
