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

  socket.on("disconnect", () => {
    console.log("user disconnected");
    for (let i = 0; i < players_connected.length; i++) {
      if (players_connected[i][1] == socket.id) {
        socket.broadcast.emit("disconnected", players_connected[i][1]);
        players_connected.splice(i, 1);
      }
    }
  });

  socket.on("playerData", (data) => {
    players_connected.push([data, socket.id]);
    socket.broadcast.emit("playerJoined", [data, socket.id]);
    socket.emit("idToClient", socket.id);
    console.log(players_connected);
  });
  socket.on("playerMovementX", (data) => {
    socket.broadcast.emit("OnlinePlayerPosX", data);
  });
  socket.on("playerMovementY", (data) => {
    socket.broadcast.emit("OnlinePlayerPosY", data);
  });
  socket.on("playerGravity", (data) => {
    socket.broadcast.emit("OnlinePlayerGravity", data);
  });

  socket.on("updatePosition", (data) => {
    socket.broadcast.emit("PlayerPosUpdate", data);
    for (let i = 0; i < players_connected.length; i++) {
      if (data.name == players_connected[i][0].name) {
        players_connected[i][0].position = data.position;
      }
    }
  });

  socket.on("loadPlayers", () => {
    socket.emit("playerList", players_connected);
  });
});

// HAMACHI
// server.listen(3000, "25.57.38.119", () => {
//   console.log("listening on *:3000");
// });

// LOCALHOST
// server.listen(3000, () => {
//   console.log("listening on *:3000");
// });

server.listen(3000, () => {
  console.log("listening on *:3000");
});
