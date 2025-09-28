'use client'

import { useState } from 'react'

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseApiOptions {
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  })

  const execute = async (
    apiCall: () => Promise<T>,
    loadingMessage: string = 'Loading...'
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const result = await apiCall()
      setState(prev => ({ ...prev, data: result, loading: false }))
      options.onSuccess?.(result)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setState(prev => ({ ...prev, error: errorMessage, loading: false }))
      options.onError?.(errorMessage)
      throw error
    }
  }

  const reset = () => {
    setState({ data: null, loading: false, error: null })
  }

  return {
    ...state,
    execute,
    reset
  }
}

export function useLazyApi<T = any>(options: UseApiOptions = {}) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  })

  const execute = async (
    apiCall: () => Promise<T>,
    loadingMessage: string = 'Loading...'
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const result = await apiCall()
      setState(prev => ({ ...prev, data: result, loading: false }))
      options.onSuccess?.(result)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setState(prev => ({ ...prev, error: errorMessage, loading: false }))
      options.onError?.(errorMessage)
      throw error
    }
  }

  const reset = () => {
    setState({ data: null, loading: false, error: null })
  }

  return {
    ...state,
    execute,
    reset
  }
}