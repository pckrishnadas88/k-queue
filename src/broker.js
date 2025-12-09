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
  ackMessage,
  recordInFlight,
  restorePending,
  init
} from "./state.js";
import { persistMessage, persistAck, loadWAL } from "./persistence.js";

const PORT = 9000;

function deliver(topic) {
  const subs = getSubscribers(topic);
  const msgs = getQueue(topic);

  while (msgs.length > 0 && subs.length > 0) {
    const { id, msg } = msgs.shift();

    for (const s of subs) {
      // record in-flight before writing so state is consistent
      recordInFlight(id, topic, msg, s);
      s.write(`MSG ${topic} ${id} ${msg}\n`);
      markPending(s, id);
    }
  }
}

async function start() {
  // 1) replay WAL
  const { pending, nextId } = loadWAL();
  if (pending && pending.length > 0) {
    restorePending(pending);
    console.log(`[KQueue] Replayed ${pending.length} pending messages from WAL`);
  }
  init(nextId);

  // 2) create TCP server
  const server = net.createServer((socket) => {
    socket.setEncoding("utf8");

    socket.on("data", (raw) => {
      const { cmd, topic, msg, id } = parse(raw);

      if (cmd === "PUB") {
        const assignedId = enqueue(topic, msg);
        persistMessage(assignedId, topic, msg); // WAL append
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

        persistAck(id); // WAL append ack
        return socket.write(`ACKED ${id}\n`);
      }

      socket.write("ERR unknown command\n");
    });

    socket.on("end", () => {
      removeSubscriber(socket);
    });

    socket.on("error", (err) => {
      console.error("socket error:", err);
      removeSubscriber(socket);
    });
  });

  server.listen(PORT, () => {
    console.log(`[KQueue] TCP broker running on port ${PORT}`);
  });
}

start().catch((e) => {
  console.error("failed to start broker:", e);
});
