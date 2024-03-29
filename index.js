const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const mysql = require("mysql");

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "spel",
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});

app.post("/login", (req, res) => {
  const { name, password } = req.body;
  const checkName = "SELECT password FROM login WHERE name = ?";
  con.query(checkName, [name], (err, result) => {
    if (err) throw err;
    if (result.length > 0) {
      const storedPassword = result[0].password;
      if (password === storedPassword) {
        res.status(200).json({ message: "Login successful" });
      } else {
        res.status(401).json({ error: "Name already taken" });
      }
    } else {
      const sql = "INSERT INTO login (name, password) VALUES (?, ?)";
      con.query(sql, [name, password], (err, result) => {
        if (err) throw err;
        console.log("User saved to database");
        res.status(201).json({ message: "User created successfully" });
      });
    }
  });
});


const players_connected = [];
const lines = [];
io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("playerData", (data) => {
    console.log(`${data.name} joined the game`);
    const sql = "SELECT x, y FROM login WHERE name = ?";
    con.query(sql, [data.name], (err, result) => {
      if (err) throw err;
      const { x, y } = result[0];
      socket.emit("startPosition", { x, y });
    });
  });

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

  socket.on("OnlineMessage", (data) => {
    for (let i = 0; i < players_connected.length; i++) {
      if (players_connected[i][1] == socket.id) {
        socket.broadcast.emit("MessageReceived", [
          data,
          players_connected[i][1],
        ]);
      }
    }
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
      socket.on("disconnect", () => {
        let name = data.name;
        let x = data.position.x;
        let y = data.position.y;

        let sql = "UPDATE login SET x = ?, y = ? WHERE name = ?";
        con.query(sql, [x, y, name], (err, result) => {
          if (err) throw err;
          console.log("User position saved to database");
          console.log(x, y, name);
        });
      })
    }
  });

  socket.on("loadPlayers", () => {
    socket.emit("playerList", players_connected);
    socket.emit("lineListLoad", lines);
  });

  socket.on("lineData", (data) => {
    lines.push(data);
    io.emit("lineList", lines);
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
