import { useCallback, useEffect, useRef } from 'react'

/**
 * A hook that returns a debounced version of the callback function.
 * The debounced function will not be called until after the specified delay,
 * and will be reset if called again within the delay period.
 * 
 * @param callback The function to debounce
 * @param delay The delay in milliseconds (default: 300ms)
 * @param dependencies Optional dependencies array for the callback
 * @returns Debounced version of the callback
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay = 300,
  dependencies: any[] = []
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Create memoized callback with dependencies
  const memoizedCallback = useCallback(callback, dependencies)
  
  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  
  // Return debounced function
  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      return new Promise<ReturnType<T>>((resolve) => {
        timeoutRef.current = setTimeout(() => {
          const result = memoizedCallback(...args)
          resolve(result as ReturnType<T>)
        }, delay)
      })
    },
    [memoizedCallback, delay]
  )
}

export default useDebouncedCallback 