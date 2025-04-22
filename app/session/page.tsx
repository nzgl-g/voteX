import React from "react";
import { SessionProvider } from "@/contexts/SessionContext";
import SessionProfile from "@/components/SessionProfile";

const Index = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm py-4 px-6">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-xl font-bold text-primary">E-Voting System</h1>
                </div>
            </nav>

            <SessionProvider>
                <SessionProfile />
            </SessionProvider>
        </div>
    );
};

export default Index;