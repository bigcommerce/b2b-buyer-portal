// Utilities for array operations.

/**
 * Splits an array into chunks of a specified size to support batching operations.
 * @param arr The array to chunk.
 * @param chunkSize The size of each chunk.
 * @returns An array of chunks.
 */
const chunkArray = <T>(arr: T[], chunkSize: number): T[][] => {
  if (chunkSize <= 0) {
    throw new Error('chunkSize must be greater than 0');
  }

  const chunkedArray: T[][] = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    // Slice extracts a portion of the array without modifying the original.
    const chunk = arr.slice(i, i + chunkSize);
    chunkedArray.push(chunk);
  }
  return chunkedArray;
};

export { chunkArray };
