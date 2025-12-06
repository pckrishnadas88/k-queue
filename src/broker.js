import net from "net";
import { parse } from "./protocol.js";
import {
    enqueue,
    addSubscriber,
    getSubscribers,
    getQueue,
    removeSubscriber
} from "./state.js";

const PORT = 9000;

function deliver(topic) {
    const subs = getSubscribers(topic);
    const msgs = getQueue(topic);

    while (msgs.length > 0 && subs.length > 0) {
        const msg = msgs.shift();

        for (const s of subs) {
            s.write(`MSG ${topic} ${msg}\n`);
        }
    }
}

const server = net.createServer((socket) => {
    socket.setEncoding("utf8");

    socket.on("data", (raw) => {
        const { cmd, topic, msg } = parse(raw);

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


        socket.write("ERR unknown command\n");
    });

    socket.on("end", () => {
        // remove closed socket from subscriber lists
        removeSubscriber(socket);
    });
});

server.listen(PORT, () => {
    console.log(`[KQueue] TCP broker running on port ${PORT}`);
});
