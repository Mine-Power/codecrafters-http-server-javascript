const net = require("net");
const fs = require("fs");
const zlib = require("zlib");

const RES_START = "HTTP/1.1";

const readHeaders = (data) => {
  const req = data.toString().split("\r\n");
  const method = req[0].split(" ")[0];
  const path = req[0].split(" ")[1];
  const headers = Object.fromEntries(req.slice(1, -2).map((header) => [header.split(": ")[0], header.split(": ")[1]]));
  const body = req[req.length - 1];
  return [method, path, headers, body];
};

const writeMessage = (socket, resStatus, resHeaders = [], body = "") => {
  const resHeaderStrs = resHeaders.map((header) => `${header[0]}: ${header[1]}`);
  const res = [`${RES_START} ${resStatus}`, ...resHeaderStrs];
  socket.write(`${res.join("\r\n")}\r\n\r\n`);
  socket.write(body);
}

const handleData = (socket, data) => {
  const [method, path, headers, body] = readHeaders(data);
  // Debug
  console.log(method, path, headers, body);

  if (path == "/") {
    writeMessage(socket, "200 OK");
    return;
  }

  if (path.includes("/echo/")) {
    let content = path.split("/echo/")[1];
    const resHeaders = [
      ["Content-Type", "text/plain"]
    ];
    if (headers["Accept-Encoding"] != null) {
      const encodings = headers["Accept-Encoding"].split(", ");
      encodings.forEach((encoding) => {
        if (encoding === "gzip") {
          resHeaders.push(["Content-Encoding", encoding]);
          content = zlib.gzipSync(content);
        }
      })
    }
    resHeaders.push(["Content-Length", content.length]);
    writeMessage(socket, "200 OK", resHeaders, content);
    return;
  }

  if (path.includes("/user-agent")) {
    const userAgent = headers["User-Agent"];
    writeMessage(socket, "200 OK", [
      ["Content-Type", "text/plain"],
      ["Content-Length", userAgent.length],
    ], userAgent);
    return;
  }

  if (path.includes("/files/")) {
    const fileName = path.split("/files/")[1];
    const directory = process.argv[3];
    switch (method) {
      case "GET":
        if (fs.existsSync(`${directory}/${fileName}`)) {
          const content = fs.readFileSync(`${directory}/${fileName}`).toString();
          writeMessage(socket, "200 OK", [
            ["Content-Type", "application/octet-stream"],
            ["Content-Length", content.length]
          ], content)
        }
        break;
      case "POST":
        fs.writeFileSync(`${directory}/${fileName}`, body);
        writeMessage(socket, "201 Created");
        break;
      default:
    }
    return;
  }

  writeMessage(socket, "404 NOT FOUND");
};

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    handleData(socket, data);
  });
  socket.on("close", () => {
    socket.end();
  });
});

server.listen(4221, "localhost");
