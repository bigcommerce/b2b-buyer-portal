import { Dispatch, useEffect, useState } from 'react'

export default function useStorageState<T>(
  key: string,
  initialState: T,
  storage = localStorage
): [T, Dispatch<T>] {
  const initialValue = () => {
    try {
      const item = storage.getItem(key)
      return item ? JSON.parse(item) : initialState
    } catch (error) {
      // If parsing fails, return initial state
      return initialState
    }
  }

  const [value, setValue] = useState(initialValue())

  // Update state and storage on change
  useEffect(() => {
    storage.setItem(key, JSON.stringify(value))
  }, [key, value, storage])

  return [value, setValue]
}
