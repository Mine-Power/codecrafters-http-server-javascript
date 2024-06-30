const net = require("net");

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const request = data.toString();
    if (request.startsWith("GET /")) {
      const httpResponse = "HTTP/1.1 200 OK\r\n\r\n";
      socket.write(httpResponse);
      return;
    }
    const httpResponse = "HTTP/1.1 404 Not Found\r\n\r\n";
    socket.write(httpResponse);
  });
  socket.on("close", () => {
    socket.end();
  });
});

server.listen(4221, "localhost");
