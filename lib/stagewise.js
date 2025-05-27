// 1. Import the toolbar
import { initToolbar } from '@stagewise/toolbar';

// 2. Define your toolbar configuration
const stagewiseConfig = {
    plugins: [
        {
            name: 'example-plugin',
            description: 'Adds additional context for your components',
            shortInfoForPrompt: () => {
                return "Context information about the selected element";
            },
            mcp: null,
            actions: [
                {
                    name: 'Example Action',
                    description: 'Demonstrates a custom action',
                    execute: () => {
                        window.alert('This is a custom action!');
                    },
                },
            ],
        },
    ],
    // Add connection options to increase reconnection attempts
    connectionOptions: {
        reconnection: true,
        reconnectionAttempts: 10, // Increase from default 5
        reconnectionDelay: 1000,
        timeout: 20000, // Increase timeout
        forceNew: true
    },
    // Add error handlers for connection issues
    errorHandlers: {
        onConnectionError: (error) => {
            console.warn('Stagewise connection error:', error);
            // Don't throw, just log
        },
        onInitError: (error) => {
            console.warn('Stagewise initialization error:', error);
            // Don't throw, just log
        }
    }
};

// Flag to track initialization attempt
let stagewiseInitialized = false;

// 3. Initialize the toolbar when your app starts
// Framework-agnostic approach - call this when your app initializes
function setupStagewise() {
    // Only initialize once and only in development mode
    if (process.env.NODE_ENV === 'development' && !stagewiseInitialized) {
        try {
            stagewiseInitialized = true;
            initToolbar(stagewiseConfig);
            console.log('Stagewise toolbar initialized successfully');
            
            // Add global error handler for Stagewise WebSocket errors
            if (typeof window !== 'undefined') {
                window.addEventListener('unhandledrejection', (event) => {
                    if (event.reason && 
                        (String(event.reason).includes('stagewise') || 
                         String(event.reason).includes('Max reconnection'))) {
                        console.warn('Suppressed Stagewise promise rejection:', event.reason);
                        event.preventDefault();
                    }
                });
            }
        } catch (error) {
            console.warn('Failed to initialize Stagewise toolbar:', error);
            // Gracefully handle toolbar initialization failure
        }
    }
}

// Call the setup function when appropriate for your framework
// Wrap in try/catch to ensure any errors don't break the application
try {
    setupStagewise();
} catch (error) {
    console.warn('Error setting up Stagewise:', error);
}