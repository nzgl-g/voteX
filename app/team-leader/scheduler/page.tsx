
import React from "react";
import BigCalendar from "@/components/team-management/big-calendar";
import { CalendarProvider } from "@/components/event-calendar/calendar-context";
import {SiteHeader} from "@/components/sidebar/site-header";


export default function Page() {
    return (


        <div className="flex h-full flex-col space-y-4">
            <SiteHeader title="Get real-time insights into your voting session."/>

            <div className="flex flex-1 flex-col gap-4 p-2 pt-0">
                <CalendarProvider>
                    <BigCalendar/>
                </CalendarProvider>
            </div>
        </div>
    )
}
