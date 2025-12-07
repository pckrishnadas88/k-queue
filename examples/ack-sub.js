import net from "net";

const s = net.createConnection(9000);
s.setEncoding("utf8");

s.on("data", (line) => {
    console.log(line.trim());

    const parts = line.split(" ");

    if (parts[0] === "MSG") {
        const id = parts[2];
        s.write(`ACK ${id}\n`);
    }
});

s.write("SUB email\n");
