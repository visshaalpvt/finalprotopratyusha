import { SignIn } from '@clerk/nextjs';
import LandingSection from '@/components/LandingSection';

export default function SiginInPage() {
  return (
    <main className="min-h-screen w-full flex flex-col">
      {/* Landing Section */}
      <div className="flex-shrink-0">
        <LandingSection />
      </div>
      
      {/* Sign In Form */}
      <div className="flex-shrink-0 flex items-center justify-center px-4 py-8 sm:py-12 bg-white">
        <div className="w-full max-w-md">
          <SignIn 
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-lg border border-light-4",
              }
            }}
          />
        </div>
      </div>
    </main>
  );
}
