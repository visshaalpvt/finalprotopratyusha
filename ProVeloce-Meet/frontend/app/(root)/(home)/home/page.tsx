'use client';

import { useEffect, useState, memo, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import MeetingTypeList from '@/components/MeetingTypeList';
import DashboardClock from '@/components/DashboardClock';
import UpcomingMeeting from '@/components/UpcomingMeeting';

const HomePage = () => {
    const { user } = useUser();
    const [date, setDate] = useState<string>('');

    const updateDate = useCallback(() => {
        const now = new Date();
        setDate(new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(now));
    }, []);

    useEffect(() => {
        updateDate();

        // Update at midnight
        const now = new Date();
        const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();

        const timeoutId = setTimeout(() => {
            updateDate();
        }, msUntilMidnight);

        return () => clearTimeout(timeoutId);
    }, [updateDate]);

    return (
        <section className="flex w-full flex-col gap-4 sm:gap-6 text-text-primary">
            {/* Hero Banner - Responsive height */}
            <div
                className="relative w-full min-h-[200px] sm:min-h-[260px] lg:min-h-[300px] rounded-2xl gradient-bg shadow-md overflow-hidden"
                role="banner"
            >
                <div className="flex h-full flex-col justify-end p-4 sm:p-6 lg:p-8">
                    {/* Time */}
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-sm">
                        <DashboardClock className="text-white" />
                    </h1>

                    {/* Date */}
                    <p className="text-sm sm:text-base lg:text-lg font-medium text-white/90 mt-1">
                        {date}
                    </p>

                    {/* Upcoming Meeting Banner */}
                    <UpcomingMeeting />
                </div>
            </div>

            {/* Meeting Actions */}
            <div className="w-full">
                <MeetingTypeList />
            </div>
        </section>
    );
};

export default memo(HomePage);
