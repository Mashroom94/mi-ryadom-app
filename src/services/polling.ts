export function shouldPoll(visibilityState: DocumentVisibilityState | string) {
  return visibilityState === 'visible'
}
