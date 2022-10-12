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
  io.to(socket.id).emit("socketId", socket.id);

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  socket.on("playerData", (data) => {
    players_connected.push(data);
    socket.broadcast.emit("playerData", data);
  });

  socket.on("playerMovement", (data) => {
    socket.broadcast.emit("OnlinePlayerPos", data);
  });

  socket.on("loadPlayers", (data) => {
    socket.emit("playerList", players_connected);
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
