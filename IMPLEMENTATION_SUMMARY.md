# Stagewise Dev-Tool Integration

## Overview

This implementation adds the stagewise dev-tool to the vote system project. Stagewise is a browser toolbar that connects frontend UI to code AI agents in your code editor, allowing developers to select elements in a web app, leave comments, and let AI agents make changes based on that context.

## Components Implemented

1. **Package Installation**
   - Added `@stagewise/toolbar` (^0.2.1) as a devDependency
   - Added `@stagewise/toolbar-next` (^0.1.2) as a devDependency for Next.js integration

2. **Root Layout Updates (`app/layout.tsx`)**
   - Implemented dynamic import of StagewiseToolbar to ensure it only loads in development mode
   - Added conditional rendering to prevent the toolbar from appearing in production builds
   - Configured a custom plugin for the toolbar with example actions

## Implementation Details

### Package Installation
The required stagewise packages were installed as development dependencies:
```json
"devDependencies": {
  "@stagewise/toolbar": "^0.2.1",
  "@stagewise/toolbar-next": "^0.1.2",
  // other dependencies...
}
```

### Development-Only Integration
To ensure the toolbar only appears in development mode, we've implemented:

1. **Dynamic Import with Next.js**
```tsx
import dynamic from 'next/dynamic';

// Only import StagewiseToolbar in development mode
const StagewiseToolbar = process.env.NODE_ENV === 'development' 
  ? dynamic(() => import('@stagewise/toolbar-next').then(mod => mod.StagewiseToolbar), { ssr: false })
  : () => null;
```

2. **Conditional Rendering**
```tsx
{process.env.NODE_ENV === 'development' && (
  <StagewiseToolbar
    config={{
      plugins: [
        // Plugin configuration...
      ]
    }}
  />
)}
```

### Custom Plugin Configuration
A custom plugin was added to demonstrate the toolbar's capabilities:

```tsx
plugins: [
  {
    name: 'Front Plugin',
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
  }
]
```

## Technical Notes

- The toolbar is only loaded in development mode to avoid impacting production performance
- Uses Next.js dynamic imports to ensure the toolbar code is not included in production bundles
- The toolbar is rendered with `{ ssr: false }` to prevent server-side rendering issues
- Custom plugins can be extended to provide more context about components to AI agents

## How to Use

1. Run the application in development mode with `npm run dev`
2. The stagewise toolbar will appear in your browser
3. Select UI elements to interact with them through the toolbar
4. Use the toolbar to leave comments or trigger actions for AI agents
5. When deploying to production, the toolbar will automatically be excluded

## Future Enhancements

1. Add more custom plugins specific to the vote system components
2. Integrate with specific AI agents for common UI modification tasks
3. Create custom actions for vote system-specific functionality
4. Add documentation links for component usage within the toolbar