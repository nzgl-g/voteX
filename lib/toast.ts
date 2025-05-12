import { toast as sonnerToast } from "sonner";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
  [key: string]: any;
};

/**
 * Unified toast function to be used throughout the application
 * Uses the sonner toast library with consistent positioning at bottom-center
 */
const compatToast = (props: ToastProps | string) => {
  if (typeof props === 'string') {
    return sonnerToast(props);
  }
  
  const { title, description, variant, duration, ...rest } = props;
  
  if (variant === "destructive") {
    return sonnerToast.error(title, {
      description,
      duration,
      ...rest
    });
  }
  
  return sonnerToast(title, {
    description,
    duration,
    ...rest
  });
};

// Add sonner toast methods to our compat toast
compatToast.success = sonnerToast.success;
compatToast.error = sonnerToast.error;
compatToast.info = sonnerToast.info;
compatToast.warning = sonnerToast.warning;
compatToast.loading = sonnerToast.loading;
compatToast.promise = sonnerToast.promise;
compatToast.dismiss = sonnerToast.dismiss;
compatToast.custom = sonnerToast.custom;

// Export the compatible toast function
export const toast = compatToast;

/**
 * Example usage:
 * 
 * import { toast } from "@/lib/toast";
 * 
 * // Success toast
 * toast.success("Operation successful");
 * 
 * // Error toast
 * toast.error("Something went wrong");
 * 
 * // Info toast
 * toast.info("Did you know?");
 * 
 * // Custom toast
 * toast("Custom message", {
 *   description: "More details here",
 *   duration: 5000,
 * });
 */ 