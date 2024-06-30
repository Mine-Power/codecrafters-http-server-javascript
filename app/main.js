const net = require("net");
var fs = require('fs');

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const request = data.toString();
    const headers = request.split("\r\n");
    const method = headers[0].split(" ")[0];
    const path = headers[0].split(" ")[1];
    let httpResponse = "HTTP/1.1 404 Not Found\r\n\r\n";
    // Debug
    console.log(headers);

    if (path == "/") {
      httpResponse = "HTTP/1.1 200 OK\r\n\r\n";
    }

    if (path.includes("/echo/")) {
      const requestString = path.split("/echo/")[1];
      let encodingString = "";
      if (headers[3].length != 0) {
        const encoding = headers[3].split("Accept-Encoding: ")[1];
        if (encoding === "gzip") {
          encodingString = `\r\nContent-Encoding: ${encoding}`
        }
      }
      httpResponse = `HTTP/1.1 200 OK${encodingString}\r\nContent-Type: text/plain\r\nContent-Length: ${requestString.length}\r\n\r\n${requestString}`;
    }

    if (path.includes("/user-agent")) {
      const userAgent = headers[2].split('User-Agent: ')[1];
      httpResponse = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`
    }

    if (path.includes("/files/")) {
      const fileName = path.split("/files/")[1];
      const directory = process.argv[3];
      switch (method) {
        case "GET":
          if (fs.existsSync(`${directory}/${fileName}`)) {
            const content = fs.readFileSync(`${directory}/${fileName}`).toString();
            httpResponse = `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${content.length}\r\n\r\n${content}`
          }
          break;
        case "POST":
          const content = headers[headers.length - 1];
          fs.writeFileSync(`${directory}/${fileName}`, content);
          httpResponse = "HTTP/1.1 201 Created\r\n\r\n";
          break;
        default:
          return
      }
    }

    socket.write(httpResponse);
  });
  socket.on("close", () => {
    socket.end();
  });
});

server.listen(4221, "localhost");
