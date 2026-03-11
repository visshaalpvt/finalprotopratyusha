'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ClerkProvider } from '@clerk/nextjs';

interface ClerkProviderClientProps {
  children: ReactNode;
  appearance: {
    layout: {
      socialButtonsVariant: 'iconButton';
      logoImageUrl: string;
    };
    variables: {
      colorText: string;
      colorPrimary: string;
      colorBackground: string;
      colorInputBackground: string;
      colorInputText: string;
    };
  };
}

export default function ClerkProviderClient({ children, appearance }: ClerkProviderClientProps) {
  const router = useRouter();

  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      routerPush={(to) => router.push(to)}
      routerReplace={(to) => router.replace(to)}
      appearance={appearance}
    >
      {children}
    </ClerkProvider>
  );
}

