const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});
players_connected = [];
io.on("connection", (socket) => {
  console.log("a user connected");
  console.log(players_connected);

  socket.on("disconnect", () => {
    console.log("user disconnected");
    for (let i = 0; i < players_connected.length; i++) {
      if (players_connected[i][1] == socket.id) {
        players_connected.pop(players_connected[i]);
      }
    }
  });

  socket.on("playerData", (data) => {
    players_connected.push([data, socket.id]);
  });

  socket.on("playerMovement", (data) => {
    socket.broadcast.emit("OnlinePlayerPos", data);
  });

  socket.on("loadPlayers", () => {
    socket.emit("playerList", players_connected);
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
