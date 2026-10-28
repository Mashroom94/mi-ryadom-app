export function normalizePushChange(endpoint: string, oldEndpoint?: string | null) {
  if (!endpoint.startsWith('https://') || endpoint.length > 2048) throw new Error('Некорректная подписка')
  return {
    endpoint,
    oldEndpoint: oldEndpoint?.startsWith('https://') && oldEndpoint.length <= 2048 ? oldEndpoint : undefined,
  }
}
