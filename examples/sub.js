import net from "net";

const socket = net.connect(9000, "127.0.0.1");

socket.write("SUB email\n");

socket.on("data", (d) => console.log("RECV:", d.toString()));
