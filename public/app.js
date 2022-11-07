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
  constructor(name, position, velocity, color, size) {
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

socket.emit("playerData", player);

let aPressed = false;
let dPressed = false;
let upPressed = false;

document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "a":
      if (!aPressed) {
        player.velocity.x = -5;
        socket.emit("playerMovementX", player);
        aPressed = true;
      }
      break;
    case "d":
      if (!dPressed) {
        player.velocity.x = 5;
        socket.emit("playerMovementX", player);
        dPressed = true;
      }
      break;
    case " ":
      if (
        player.position.y + player.size.y + player.velocity.y >
          myCanvas.height &&
        upPressed == false
      ) {
        player.velocity.y = -1;
        upPressed = true;
      }
      socket.emit("playerMovementY", player);
      break;
  }
});

document.addEventListener("keyup", (e) => {
  switch (e.key) {
    case "a":
      if (dPressed) {
        player.velocity.x = 5;
        socket.emit("playerMovementX", player);
        socket.emit("updatePosition", player);
      } else {
        player.velocity.x = 0;
        socket.emit("playerMovementX", player);
        socket.emit("updatePosition", player);
      }
      aPressed = false;
      break;
    case "d":
      if (aPressed) {
        player.velocity.x = -5;
        socket.emit("playerMovementX", player);
        socket.emit("updatePosition", player);
      } else {
        player.velocity.x = 0;
        socket.emit("playerMovementX", player);
        socket.emit("updatePosition", player);
      }
      dPressed = false;
      break;
    case " ":
      upPressed = false;
      break;
  }
});

let players_connected;
let players = [];

socket.on("OnlinePlayerPosX", (data) => {
  for (let i = 0; i < players.length; i++) {
    if (players[i].name == data.name) {
      players[i].velocity.x = data.velocity.x;
      break;
    }
  }
});
socket.on("OnlinePlayerPosY", (data) => {
  for (let i = 0; i < players.length; i++) {
    if (players[i].name == data.name) {
      players[i].velocity.y = data.velocity.y;
      break;
    }
  }
});

socket.on("PlayerPosUpdate", (data) => {
  for (let i = 0; i < players.length; i++) {
    if (players[i].name == data.name) {
      players[i].position.x = data.position.x;
      players[i].position.y = data.position.y;
      console.log(players[i].name, "position was updated");
      break;
    }
  }
});

function load() {
  for (let i = 0; i < players_connected.length; i++) {
    if (players_connected[i][0].name != userName) {
      console.log(players_connected[i][0].position);
      players.push(
        new OnlinePlayer(
          players_connected[i][0].name,
          players_connected[i][0].position,
          players_connected[i][0].velocity,
          (players_connected[i][0].color = "purple"),
          players_connected[i][0].size
        )
      );
    }
  }
}
let x = 0;

function animate() {
  requestAnimationFrame(animate);
  c.clearRect(0, 0, innerWidth, innerHeight);
  if (x < 2.5 && upPressed) {
    x += 0.2;
    player.velocity.y -= 0.8 * (5 * x - 2 * x ** 2);
    socket.emit("playerMovementY", player);
  } else {
    upPressed = false;
    x = 0;
    socket.emit("playerMovementY", player);
  }
  player.update();
  for (let i = 0; i < players.length; i++) {
    players[i].update();
  }
  console.log(player.velocity.y);
}

socket.emit("loadPlayers");
socket.on("playerList", (data) => {
  players_connected = data;
  load();
  animate();
});

socket.on("playerJoined", (data) => {
  players.push(
    new OnlinePlayer(
      data.name,
      data.position,
      data.velocity,
      (data.color = "purple"),
      data.size
    )
  );
});

socket.on("disconnected", (data) => {
  for (let i = 0; i < players.length; i++) {
    if (data.name == players[i].name) {
      players.splice(i);
    }
  }
});
