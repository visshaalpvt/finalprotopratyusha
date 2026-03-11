'use client';

export default function Loading() {
    return (
        <div className="w-full animate-pulse">
            <div className="h-8 w-48 bg-bg-tertiary rounded-lg mb-6" />
            <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 bg-bg-tertiary rounded-lg" />
                ))}
            </div>
        </div>
    );
}
