import { ReactNode } from 'react';
import AuthHeader from '@/components/AuthHeader';

const AuthLayout = ({ children }: { children: ReactNode }) => {
    return (
        <main className="min-h-screen bg-bg-secondary">
            <AuthHeader />
            {children}
        </main>
    );
};

export default AuthLayout;
