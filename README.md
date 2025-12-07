# K-Queue (v0.1) — Minimal TCP Message Queue

```
KQueue/
.
├── examples
│   ├── pub.js
│   └── sub.js
├── package.json
├── README.md
└── src
    ├── broker.js
    ├── protocol.js
    └── state.js
```


# KQueue — Minimal TCP Message Queue (Pure Node.js)

KQueue is a **very small, educational message queue** built using raw TCP sockets.
The goal is to learn **TCP, protocols, buffers, framing, PUB/SUB systems, and broker design**.

## Features (v0.1)

- Raw TCP broker built with Node.js `net` module
- PUB/SUB messaging system
- Multiple subscribers per topic
- In-memory queue per topic
- Automatic message delivery
- Clean subscriber removal when clients disconnect
- PING/PONG heartbeat for connection health checks
- Simple custom text protocol (PUB, SUB, PING)


| Milestone                      | Status  | Description                                                |
| ------------------------------ | ------  | -----------------------------------------------------------|
| TCP & Protocol                 | ✅      | Stabilize PUB, SUB, PING; clean parser; subscriber cleanup |
| Core Queue                     | ✅      | Topic queues, fanout, backpressure handling                |
| ACK / Message IDs              | ✅      | Assign IDs, implement ACK, remove messages after ACK       |
| Persistence V1                 | ⬜      | WAL or simple disk persistence to survive restarts         |
| Clustering                     | ⬜      | Multiple broker nodes, heartbeat between nodes             |
| Leader Election                | ⬜      | Simple leader election for replication coordination        |
| Replicated Log                 | ⬜      | Leader writes → followers replicate; commit index handling |
| Partitioning & Consumer Groups | ⬜      | Partition topics, round-robin consumer load balancing      |
| Performance & Benchmarks       | ⬜      | Throughput, latency tests, optimize delivery               |
| Multi-Language Client SDKs     | ⬜      | JS/Go/Python clients to interact with KQueue               |
| Reliability                    | ⬜      | Retry policies, dead-letter queues, redelivery tracking    |
| Documentation & Polish         | ⬜      | README, architecture diagrams, examples, roadmap           |
