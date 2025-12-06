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
