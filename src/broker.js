// broker.js
import net from "net";
import { parse } from "./protocol.js";
import {
    enqueue,
    addSubscriber,
    getSubscribers,
    getQueue,
    removeSubscriber,
    markPending,
    ackMessage
} from "./state.js";

const PORT = 9000;

function deliver(topic) {
    const subs = getSubscribers(topic);
    const msgs = getQueue(topic);

    while (msgs.length > 0 && subs.length > 0) {
        const { id, msg } = msgs.shift();

        for (const s of subs) {
            s.write(`MSG ${topic} ${id} ${msg}\n`);
            markPending(s, id);
        }
    }
}

const server = net.createServer((socket) => {
    socket.setEncoding("utf8");

    socket.on("data", (raw) => {
        const { cmd, topic, msg, id } = parse(raw);

        if (cmd === "PUB") {
            enqueue(topic, msg);
            deliver(topic);
            return socket.write("OK\n");
        }

        if (cmd === "SUB") {
            addSubscriber(topic, socket);
            deliver(topic);
            return socket.write(`SUBSCRIBED ${topic}\n`);
        }

        if (cmd === "PING") {
            return socket.write("PONG\n");
        }

        if (cmd === "ACK") {
            const ok = ackMessage(socket, id);

            if (!ok) return socket.write("ERR unknown-id\n");

            return socket.write(`ACKED ${id}\n`);
        }

        socket.write("ERR unknown command\n");
    });

    socket.on("end", () => {
        removeSubscriber(socket);
    });
});

server.listen(PORT, () => {
    console.log(`[KQueue] TCP broker running on port ${PORT}`);
});
