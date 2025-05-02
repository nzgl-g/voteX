'use client';

import { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/shadcn-ui/button';
import { Input } from '@/components/shadcn-ui/input';
import { Textarea } from '@/components/shadcn-ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shadcn-ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/shadcn-ui/card';

type NotificationType = 'info' | 'success' | 'warning' | 'error';

export default function TestNotificationPage() {
  const [notification, setNotification] = useState({
    message: '',
    type: 'info' as NotificationType,
    userId: '' // Leave empty to send to all users
  });

  const handleSendNotification = async () => {
    try {
      await axios.post('http://localhost:2000/votex/api/notifications/send', notification);
      alert('Notification sent successfully!');
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification. Check console for details.');
    }
  };

  return (
    <div className="container py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Test Notification System</CardTitle>
          <CardDescription>
            Send test notifications to users using Socket.io
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="message">Notification Message</label>
            <Textarea 
              id="message"
              value={notification.message}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                setNotification({ ...notification, message: e.target.value })
              }
              placeholder="Enter your notification message"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="type">Notification Type</label>
            <Select 
              value={notification.type} 
              onValueChange={(value: NotificationType) => 
                setNotification({ ...notification, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select notification type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="userId">User ID (Optional)</label>
            <Input 
              id="userId"
              value={notification.userId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                setNotification({ ...notification, userId: e.target.value })
              }
              placeholder="Enter user ID or leave empty to send to all"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSendNotification} className="w-full">
            Send Notification
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 