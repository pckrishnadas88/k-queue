// persistence.js
import fs from "fs";
import path from "path";

const DIR = path.resolve(process.cwd(), "data");
const WAL = path.join(DIR, "wal.log");

if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

let writeStream = fs.createWriteStream(WAL, { flags: "a" });

function appendEntry(obj) {
  const line = JSON.stringify(obj) + "\n";
  // best-effort append
  if (!writeStream.write(line)) {
    // backpressure: create a new stream after drain
    writeStream.once("drain", () => {});
  }
}

/**
 * Persist a published message: { type: 'pub', id, topic, msg }
 */
export function persistMessage(id, topic, msg) {
  appendEntry({ type: "pub", id, topic, msg });
}

/**
 * Persist an ack: { type: 'ack', id }
 */
export function persistAck(id) {
  appendEntry({ type: "ack", id });
}

/**
 * Replay WAL: returns { pending: [ { id, topic, msg } ... ], nextId }
 * pending = published messages which are not ACKed (in order of last appearance).
 */
export function loadWAL() {
  if (!fs.existsSync(WAL)) {
    return { pending: [], nextId: 1 };
  }

  const data = fs.readFileSync(WAL, "utf8").trim();
  if (!data) return { pending: [], nextId: 1 };

  const lines = data.split("\n").map((l) => l.trim()).filter(Boolean);

  // Keep a map of id -> last known record
  const map = new Map();
  let maxId = 0;

  for (const line of lines) {
    try {
      const rec = JSON.parse(line);
      if (rec && typeof rec.id === "number") {
        map.set(rec.id, { ...map.get(rec.id), ...rec });
        if (rec.id > maxId) maxId = rec.id;
      }
    } catch (err) {
      // ignore corrupt line but continue
      console.error("[WAL] failed parse line:", err);
    }
  }

  // Reconstruct pending messages (those that have pub with no ack)
  const pending = [];
  for (const [id, rec] of map.entries()) {
    if (rec.type === "pub" || (rec.topic && rec.msg)) {
      if (!rec.acked && rec.type !== "ack") {
        pending.push({ id, topic: rec.topic, msg: rec.msg });
      } else if (!rec.acked && rec.type === "pub") {
        // pub without later ack
        pending.push({ id, topic: rec.topic, msg: rec.msg });
      } else if (rec.type === "pub" && rec.acked === undefined) {
        // covercases; treat as pending
        pending.push({ id, topic: rec.topic, msg: rec.msg });
      }
    }
  }

  // Sort pending by id ascending to preserve original order
  pending.sort((a, b) => a.id - b.id);

  return { pending, nextId: maxId + 1 };
}
