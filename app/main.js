const net = require("net");
var fs = require('fs');

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const request = data.toString();
    const url = request.split(" ")[1];
    const headers = request.split("\r\n");
    let httpResponse = "HTTP/1.1 404 Not Found\r\n\r\n";

    if (url == "/") {
      httpResponse = "HTTP/1.1 200 OK\r\n\r\n";
    }
    if (url.includes("/echo/")) {
      const requestString = url.split("/echo/")[1];
      httpResponse = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${requestString.length}\r\n\r\n${requestString}`;
    }
    if (url.includes("/user-agent")) {
      const userAgent = headers[2].split('User-Agent: ')[1];
      httpResponse = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`
    }
    if (url.includes("/files/")) {
      const fileName = url.split("/files/")[1];
      const directory = process.argv[3];
      if (fs.existsSync(`${directory}/${fileName}`)) {
        const content = fs.readFileSync(`${directory}/${fileName}`).toString();
        httpResponse = `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${content.length}\r\n\r\n${content}`
      } else {
        httpResponse = "HTTP/1.1 404 Not Found\r\n\r\n";
      }
    }

    socket.write(httpResponse);
  });
  socket.on("close", () => {
    socket.end();
    server.close();
  });
});

server.listen(4221, "localhost");
