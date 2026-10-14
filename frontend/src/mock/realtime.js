/** In-page pub/sub that stands in for the STOMP WebSocket in demo mode. */
const conversationListeners = new Map();
const notificationListeners = new Map();

const add = (map, key, fn) => {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(fn);
  return () => map.get(key)?.delete(fn);
};

export const bus = {
  onMessage: (conversationId, fn) => add(conversationListeners, Number(conversationId), fn),
  onNotification: (userId, fn) => add(notificationListeners, Number(userId), fn),
  emitMessage: (conversationId, message) => {
    // Async, like a network round-trip, so optimistic UI and the echo don't collide.
    setTimeout(() => conversationListeners.get(Number(conversationId))?.forEach((fn) => fn(message)), 120);
  },
  emitNotification: (userId, notification) => {
    setTimeout(() => notificationListeners.get(Number(userId))?.forEach((fn) => fn(notification)), 120);
  },
};
