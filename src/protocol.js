export function parse(data) {
    const text = data.toString().trim();
    const parts = text.split(" ");
    const cmd = parts[0];

    if (cmd === "PUB") {
        // PUB topic message...
        const topic = parts[1];
        const msg = parts.slice(2).join(" ");
        return { cmd, topic, msg };
    }

    if (cmd === "SUB") {
        // SUB topic
        const topic = parts[1];
        return { cmd, topic };
    }

    if (cmd === "PING") {
        return { cmd: "PING" };
    }


    return { cmd: "ERR" };
}
