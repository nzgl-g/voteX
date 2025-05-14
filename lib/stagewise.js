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
};

// 3. Initialize the toolbar when your app starts
// Framework-agnostic approach - call this when your app initializes
function setupStagewise() {
    // Only initialize once and only in development mode
    if (process.env.NODE_ENV === 'development') {
        initToolbar(stagewiseConfig);
    }
}

// Call the setup function when appropriate for your framework
setupStagewise();