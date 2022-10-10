let socket = io();
window.focus;
let myCanvas = document.getElementById("myCanvas");
let c = myCanvas.getContext("2d");
myCanvas.width = 960;
myCanvas.height = 540;

const gravity = 0.7;

class Player {
  constructor({ name, position, velocity, color, size }) {
    this.name = name;
    this.position = position;
    this.velocity = velocity;
    this.color = color;
    this.size = size;
  }

  render() {
    c.fillStyle = this.color;
    c.fillRect(this.position.x, this.position.y, this.size.x, this.size.y);
  }

  update() {
    this.render();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    if (this.position.y + this.size.y + this.velocity.y > myCanvas.height) {
      this.velocity.y = 0;
    } else {
      this.velocity.y += gravity;
    }
  }
}

class OnlinePlayer {
  constructor({ name, position, velocity, color, size }) {
    this.name = name;
    this.position = position;
    this.velocity = velocity;
    this.color = color;
    this.size = size;
  }

  render() {
    c.fillStyle = this.color;
    c.fillRect(this.position.x, this.position.y, this.size.x, this.size.y);
  }

  update() {
    this.render();
    console.log("dx = ", this.velocity.x);
    console.log("dy = ", this.velocity.y);
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}

userName = prompt("enter ur name");
const player = new Player({
  name: userName,
  color: "red",
  position: {
    x: 0,
    y: 0,
  },
  velocity: {
    x: 0,
    y: 0,
  },
  size: {
    x: 50,
    y: 70,
  },
});
let socketid;
socket.on("socketId", (data) => {
  socketid = data;
});
let online_player;
socket.emit("playerData", player);
socket.on("playerData", (data) => {
  online_player = new OnlinePlayer(
    data.name,
    data.position,
    data.velocity,
    data.color,
    data.size
  );
  players_connected.append(online_player);
});

document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "a":
      player.velocity.x = -5;
      break;
    case "d":
      player.velocity.x = 5;
      break;
    case " ":
      if (
        player.position.y + player.size.y + player.velocity.y >
        myCanvas.height
      ) {
        player.velocity.y = -20;
      }
      break;
  }
});
socket.on("OnlinePlayerPos", (data) => {
  console.log(data);
  console.log(online_player);
  console.log(players_connected);
  online_player.velocity.x = data.velocity.x;
  online_player.velocity.y = data.velocity.y;
  online_player.update();
});
let players_connected;
socket.emit("loadPlayers", socketid);
socket.on("playerList", (data) => {
  players_connected = data;
  console.log("done");
});
function load() {
  for (let index = 0; index < players_connected.length; index++) {}
}
function animate() {
  requestAnimationFrame(animate);
  c.clearRect(0, 0, innerWidth, innerHeight);
  player.update();
  if (player.velocity.x != 0 || player.velocity.y != 0) {
    socket.emit("playerMovement", player.velocity);
  }
}

animate();
