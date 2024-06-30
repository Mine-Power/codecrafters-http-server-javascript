const net = require("net");

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const request = data.toString();
    const url = request.split(" ")[1];
    const httpResponse = "HTTP/1.1 404 Not Found\r\n\r\n";

    if (url == "/") {
      httpResponse = "HTTP/1.1 200 OK\r\n\r\n";
    }
    if (url.includes("/echo/")) {
      const requestString = url.split("/echo/")[1];
      httpResponse = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 3\r\n\r\n${requestString}`;
    }

    socket.write(httpResponse);
  });
  socket.on("close", () => {
    socket.end();
  });
});

server.listen(4221, "localhost");
