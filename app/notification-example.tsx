'use client';

import { useEffect } from 'react';
import { NotificationButton } from '@/components/shared/notification-button';
import { Button } from '@/components/ui/button';

export default function NotificationExample() {
  // Mock function to simulate receiving a notification
  const simulateNotification = () => {
    // In a real app, this would come from the server via socket.io
    // Here we're just simulating the event by dispatching it manually
    const mockNotification = {
      id: Math.random().toString(),
      type: 'system',
      message: 'This is a test notification',
      link: '#',
      targetType: 'user',
      category: 'Alert',
      timestamp: new Date().toISOString(),
      read: false,
      createdAt: new Date().toISOString(),
    };
    
    // Dispatch a custom event to simulate socket.io
    const event = new CustomEvent('mock-notification', { 
      detail: mockNotification 
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Notification Example</h1>
        <NotificationButton />
      </div>
      
      <div className="space-y-4">
        <p>
          This is an example page showing how to use the notification system.
          Click the button below to simulate receiving a notification.
        </p>
        
        <Button onClick={simulateNotification}>
          Simulate Notification
        </Button>
      </div>
    </div>
  );
} 