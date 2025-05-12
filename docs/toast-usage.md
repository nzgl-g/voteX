# Toast Usage Guidelines

## Overview

To ensure consistent toast notifications across the entire application, all components should use the unified toast system.

## Usage

Import the toast utility from the lib/toast.ts file:

```tsx
import { toast } from "@/lib/toast";
```

## Examples

### Basic Toast

```tsx
toast("This is a simple toast message");
```

### Toast with Title and Description

```tsx
toast({
  title: "Action Completed",
  description: "Your task has been successfully completed."
});
```

### Success Toast

```tsx
toast.success("Operation completed successfully!");
```

### Error Toast

```tsx
toast.error("Something went wrong!");
```

### Warning Toast

```tsx
toast.warning("Be careful!");
```

### Info Toast

```tsx
toast.info("Just so you know...");
```

### Loading Toast

```tsx
toast.loading("Processing your request...");
```

### Promise Toast (shows loading, success/error states automatically)

```tsx
toast.promise(
  fetch('/api/data'), 
  {
    loading: 'Fetching data...',
    success: 'Data loaded!',
    error: 'Error fetching data'
  }
);
```

### Duration

You can set a custom display duration in milliseconds:

```tsx
toast({
  title: "Action completed",
  description: "Task done successfully",
  duration: 5000 // 5 seconds
});
```

## Migration Guidelines

If you're still using the old toast system (from @radix-ui/react-toast or directly from sonner), please update your imports and calls to use the unified system:

### Old Usage (from @radix-ui/react-toast):

```tsx
import { useToast } from "@/components/ui/use-toast";

const { toast } = useToast();

toast({
  title: "Title",
  description: "Description",
  variant: "destructive"
});
```

### New Usage:

```tsx
import { toast } from "@/lib/toast";

toast({
  title: "Title",
  description: "Description",
  variant: "destructive"
});
```

## Toast Configuration

The toast appears at the bottom-center of the screen by default. This is configured globally in the `app/layout.tsx` file using our custom `Toaster` component from `@/components/ui/sonner`. 