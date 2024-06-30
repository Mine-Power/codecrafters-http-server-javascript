const net = require("net");
var fs = require('fs');

const readHeaders = (data) => {
  const response = data.toString().split("\r\n");
  console.log(response);
  const method = response[0].split(" ")[0];
  const path = response[0].split(" ")[1];
  const body = null;
  return [
    method,
    path,
    Object.fromEntries(response.slice(1, -2).map((header) => [header.split(": ")[0], header.split(": ")[1]])),
    body
  ];
};

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const [method, path, headers, body] = readHeaders(data);
    let httpResponse = "HTTP/1.1 404 Not Found\r\n\r\n";
    // Debug
    console.log(method, path, headers, body);

    if (path == "/") {
      httpResponse = "HTTP/1.1 200 OK\r\n\r\n";
    }

    if (path.includes("/echo/")) {
      const requestString = path.split("/echo/")[1];
      let encodingString = "";
      if (headers["Accept-Encoding"] != null) {
        const encoding = headers["Accept-Encoding"];
        console.log(encoding);
        if (encoding === "gzip") {
          encodingString = `\r\nContent-Encoding: ${encoding}`
        }
      }
      httpResponse = `HTTP/1.1 200 OK${encodingString}\r\nContent-Type: text/plain\r\nContent-Length: ${requestString.length}\r\n\r\n${requestString}`;
    }

    if (path.includes("/user-agent")) {
      const userAgent = headers["User-Agent"];
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
          fs.writeFileSync(`${directory}/${fileName}`, body);
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
