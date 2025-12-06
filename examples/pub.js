import net from "net";

const socket = net.connect(9000, "127.0.0.1");

socket.write("PUB email Hello_World\n");
socket.end();
