/**
 * @example
 * // Error instance
 * extractErrorMessage(new Error('Something went wrong')) // => 'Something went wrong'
 *
 * // String
 * extractErrorMessage('Simple error') // => 'Simple error'
 *
 * // Error-like object with message
 * extractErrorMessage({ message: 'API error' }) // => 'API error'
 */
export function extractErrorMessage(error: unknown): string {
  // Handle Error instances (most common case)
  if (error instanceof Error) {
    return error.message;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Handle error-like objects
  if (typeof error === 'object' && error !== null) {
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
  }

  return error as string;
}
