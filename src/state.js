// Holds topics -> queued messages
export const queues = new Map();

// Holds topics -> array of subscriber sockets
export const subscribers = new Map();

export function enqueue(topic, msg) {
    if (!queues.has(topic)) queues.set(topic, []);
    queues.get(topic).push(msg);
}

export function addSubscriber(topic, socket) {
    if (!subscribers.has(topic)) subscribers.set(topic, []);
    subscribers.get(topic).push(socket);
}

export function getSubscribers(topic) {
    return subscribers.get(topic) || [];
}

export function getQueue(topic) {
    return queues.get(topic) || [];
}
