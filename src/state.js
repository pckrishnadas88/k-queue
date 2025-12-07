// state.js

// topic -> [ { id, msg } ]
const queues = new Map();

// topic -> [ socket ]
const subscribers = new Map();

// socket -> Set(messageIds)
const pending = new Map();

let nextId = 1;

export function enqueue(topic, msg) {
    if (!queues.has(topic)) queues.set(topic, []);
    queues.get(topic).push({
        id: nextId++,
        msg
    });
}

export function getQueue(topic) {
    if (!queues.has(topic)) queues.set(topic, []);
    return queues.get(topic);
}

export function addSubscriber(topic, socket) {
    if (!subscribers.has(topic)) subscribers.set(topic, []);
    subscribers.get(topic).push(socket);
}

export function getSubscribers(topic) {
    return subscribers.get(topic) || [];
}

export function markPending(socket, id) {
    if (!pending.has(socket)) pending.set(socket, new Set());
    pending.get(socket).add(id);
}

export function ackMessage(socket, id) {
    const set = pending.get(socket);
    if (!set) return false;

    if (!set.has(id)) return false;

    set.delete(id);
    return true;
}

export function removeSubscriber(socket) {
    for (const [topic, list] of subscribers.entries()) {
        subscribers.set(
            topic,
            list.filter(s => s !== socket)
        );
    }
    pending.delete(socket);
}
