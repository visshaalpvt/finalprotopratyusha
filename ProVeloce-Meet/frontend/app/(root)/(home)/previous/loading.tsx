'use client';

export default function Loading() {
    return (
        <div className="w-full animate-pulse">
            <div className="h-8 w-48 bg-bg-tertiary rounded-lg mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-32 bg-bg-tertiary rounded-xl" />
                ))}
            </div>
        </div>
    );
}
