import { Metadata } from 'next';
import { ReactNode } from 'react';

import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { MeetingProvider } from '@/providers/MeetingProvider';

export const metadata: Metadata = {
  title: 'ProVeloce Meet',
  description: 'A workspace for your team, powered by Stream Chat and Clerk.',
};

const RootLayout = ({ children }: Readonly<{ children: ReactNode }>) => {
  return (
    <MeetingProvider>
      <main className="relative min-h-screen min-h-[100dvh] bg-bg-secondary overflow-x-hidden">
        <Navbar />

        <div className="flex pt-16">
          <Sidebar />

          {/* Main content - Responsive padding */}
          <section className="flex min-h-[calc(100vh-4rem)] min-h-[calc(100dvh-4rem)] flex-1 flex-col px-3 sm:px-4 md:px-6 lg:px-8 pb-6 pt-4 sm:pt-6 overflow-x-hidden">
            <div className="w-full max-w-7xl mx-auto">{children}</div>
          </section>
        </div>
      </main>
    </MeetingProvider>
  );
};

export default RootLayout;
