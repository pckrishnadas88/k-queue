// state.js
// Simple in-memory state with hooks for persistence.
import { EventEmitter } from "events";

const queues = new Map();    // topic -> [ { id, msg } ... ]
const subscribers = new Map(); // subId -> { socket, topic }
let subIdCounter = 0;

const inFlight = new Map(); // id -> { id, topic, msg, subId }
const pendingBySub = new Map(); // subId -> Set(ids)

let idCounter = 1;

export const events = new EventEmitter(); // optional: for external hooks

export function init(nextId = 1) {
  idCounter = nextId;
}

/** enqueue returns assigned message id */
export function enqueue(topic, msg) {
  const id = idCounter++;
  if (!queues.has(topic)) queues.set(topic, []);
  queues.get(topic).push({ id, msg });
  events.emit("enqueue", { id, topic, msg });
  return id;
}

/** internal: push message (used during WAL restore to add a known id) */
export function enqueueWithId(id, topic, msg) {
  // ensure idCounter is higher
  if (id >= idCounter) idCounter = id + 1;
  if (!queues.has(topic)) queues.set(topic, []);
  queues.get(topic).push({ id, msg });
  events.emit("enqueue", { id, topic, msg });
}

/** getQueue returns the actual array for deliver() to shift from */
export function getQueue(topic) {
  if (!queues.has(topic)) queues.set(topic, []);
  return queues.get(topic);
}

/** subscriber management */
export function addSubscriber(topic, socket) {
  const subId = ++subIdCounter;
  socket._subId = subId;
  subscribers.set(subId, { socket, topic });
  pendingBySub.set(subId, new Set());
  events.emit("subscribe", { subId, topic });
  return subId;
}

export function getSubscribers(topic) {
  const out = [];
  for (const { socket, topic: t } of subscribers.values()) {
    if (t === topic) out.push(socket);
  }
  return out;
}

export function removeSubscriber(socket) {
  const subId = socket._subId;
  if (!subId) return;
  subscribers.delete(subId);
  pendingBySub.delete(subId);
  // move any inFlight messages assigned to this sub back to head of queue
  for (const [id, info] of inFlight.entries()) {
    if (info.subId === subId) {
      // put back to queue head for redelivery
      if (!queues.has(info.topic)) queues.set(info.topic, []);
      queues.get(info.topic).unshift({ id: info.id, msg: info.msg });
      inFlight.delete(id);
    }
  }
  events.emit("unsubscribe", { subId });
}

/** mark message as pending for a subscriber */
export function markPending(socket, id) {
  const subId = socket._subId;
  if (!subId) return false;
  // find message details (we assume messages were shifted from queue by deliver)
  // Ensure message is tracked in inFlight
  // (deliver should call markPending immediately after sending the message)
  const pending = pendingBySub.get(subId);
  if (!pending) return false;
  pending.add(id);
  // if message not in inFlight, we still need topic/msg; deliver() must have recorded it
  events.emit("markPending", { subId, id });
  return true;
}

/** Called by ACK command: check ownership and ack */
export function ackMessage(socket, id) {
  const subId = socket._subId;
  if (!subId) return false;
  const pending = pendingBySub.get(subId);
  if (!pending || !pending.has(id)) return false;

  // remove from pending set
  pending.delete(id);

  // Remove inFlight record
  inFlight.delete(id);

  events.emit("ack", { subId, id });
  return true;
}

/** expose helper for deliver to record inFlight entry */
export function recordInFlight(id, topic, msg, socket) {
  const subId = socket._subId;
  inFlight.set(id, { id, topic, msg, subId });
}

/** expose a function to get pending messages for a topic (for redelivery when subscriber connects) */
export function getPending(topic) {
  const out = [];
  // pending messages are those that are currently in queues (not yet delivered)
  // plus messages in inFlight for that topic belonging to no-length? we'll prefer returning queue
  if (!queues.has(topic)) return out;
  return queues.get(topic).slice(); // shallow copy
}

/** for WAL replay to populate queues with known ids */
export function restorePending(list) {
  for (const m of list) {
    enqueueWithId(m.id, m.topic, m.msg);
  }
}

/** helper to find and remove message by id from queues (if needed) */
export function removeMessageFromQueues(id) {
  for (const [topic, arr] of queues.entries()) {
    const idx = arr.findIndex((m) => m.id === id);
    if (idx !== -1) {
      arr.splice(idx, 1);
      return true;
    }
  }
  return false;
}
