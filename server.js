const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path")

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static("public"));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
})

const rooms = new Map();

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("create", () => {
    const roomId = generateRoomId();
    console.log(`Created room ${roomId}`)
    socket.join(roomId);
    rooms.set(roomId, {
      players: [{ id: socket.id }],
    });
    socket.emit("created", { roomId, player: 1 });
  });

  socket.on("join", (roomId) => {
    const room = rooms.get(roomId);
    console.log(`Joined room ${roomId}`)
    if (room && room.players.length === 1) {
      room.players.push({ id: socket.id });
      rooms.set(roomId, room);
      socket.join(roomId);
      socket.emit("joined", { roomId, player: 1 });
      io.to(roomId).emit("start");
    } else {
      socket.emit("error", "Room not found or already full.");
    }
  });

  socket.on("move", (data) => {
    socket.to(data.roomId).emit("move", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

function generateRoomId() {
  let roomId = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let i = 0; i < 4; i++) {
    roomId += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return roomId;
}

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
