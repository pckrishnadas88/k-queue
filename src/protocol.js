// protocol.js

export function parse(data) {
    const text = data.toString().trim();
    const parts = text.split(" ");
    const cmd = parts[0];

    if (cmd === "PUB") {
        const topic = parts[1];
        const msg = parts.slice(2).join(" ");
        return { cmd, topic, msg };
    }

    if (cmd === "SUB") {
        const topic = parts[1];
        return { cmd, topic };
    }

    if (cmd === "ACK") {
        return { cmd, id: Number(parts[1]) };
    }

    if (cmd === "PING") {
        return { cmd: "PING" };
    }

    return { cmd: "ERR" };
}
