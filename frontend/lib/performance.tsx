import React, { useState, useEffect, useCallback, useMemo } from 'react'

// Debounce hook for search/filter operations
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Throttle hook for frequent operations
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const [lastRun, setLastRun] = useState(0)

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      if (now - lastRun >= delay) {
        setLastRun(now)
        callback(...args)
      }
    },
    [callback, delay, lastRun]
  ) as T
}

// Memoized API call hook
export function useMemoizedApiCall<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = [],
  cacheTime: number = 5 * 60 * 1000 // 5 minutes
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastFetch, setLastFetch] = useState(0)

  const fetchData = useCallback(async () => {
    const now = Date.now()

    // Return cached data if still valid
    if (data && now - lastFetch < cacheTime) {
      return data
    }

    try {
      setLoading(true)
      setError(null)
      const result = await apiCall()
      setData(result)
      setLastFetch(now)
      return result
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [apiCall, data, lastFetch, cacheTime])

  // Auto-fetch when dependencies change
  useEffect(() => {
    fetchData()
  }, dependencies)

  return { data, loading, error, refetch: fetchData }
}

// Virtual scrolling hook for large lists
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight)
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    )
    return { start: Math.max(0, start - overscan), end }
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length])

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end)
  }, [items, visibleRange])

  const totalHeight = items.length * itemHeight
  const offsetY = visibleRange.start * itemHeight

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: useCallback((e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop)
    }, []),
  }
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [ref, setRef] = useState<Element | null>(null)

  useEffect(() => {
    if (!ref) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, options)

    observer.observe(ref)

    return () => {
      observer.disconnect()
    }
  }, [ref, options])

  return [setRef, isIntersecting] as const
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const startTime = performance.now()

    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime

      if (duration > 16) { // Longer than one frame (16ms)
        console.warn(`${componentName} took ${duration.toFixed(2)}ms to render`)
      }
    }
  })
}

// Optimized list rendering hook
export function useOptimizedList<T>(
  items: T[],
  keyExtractor: (item: T, index: number) => string | number,
  renderItem: (item: T, index: number) => React.ReactNode,
  batchSize: number = 50
) {
  const [visibleCount, setVisibleCount] = useState(batchSize)

  const visibleItems = useMemo(() => {
    return items.slice(0, visibleCount)
  }, [items, visibleCount])

  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + batchSize, items.length))
  }, [items.length, batchSize])

  const renderedItems = useMemo(() => {
    return visibleItems.map((item, index) => (
      <div key={keyExtractor(item, index)}>
        {renderItem(item, index)}
      </div>
    ))
  }, [visibleItems, keyExtractor, renderItem])

  return {
    renderedItems,
    loadMore,
    hasMore: visibleCount < items.length,
    totalCount: items.length,
    visibleCount,
  }
}