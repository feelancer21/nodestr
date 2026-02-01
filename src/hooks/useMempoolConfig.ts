export function useMempoolConfig() {
  const baseUrl = import.meta.env.VITE_MEMPOOL_URL || 'https://mempool.space';
  return { baseUrl };
}
