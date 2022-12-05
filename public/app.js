let color = "";
let first = false;
let second = false;
color_picker = document.getElementsByClassName("size");
console.log(color_picker);
for (let i = 0; i < color_picker.length; i++) {
  color_picker[i].onclick = function () {
    color = color_picker[i].classList[0];
    if (first == false) {
      if (color == "black") {
        first = true;
      } else {
        first = false;
      }
    }
    if (second == false) {
      if (first == true && color == "red" && second == false) {
        second = true;
      } else {
        second = false;
      }
    }
    if (second == true && color == "blue") {
      color = "yellow";
    }

    color_picker[i].style.border = "1px white solid";
    for (let j = 0; j < color_picker.length; j++) {
      if (j != i) {
        color_picker[j].style.border = "0px";
      }
    }
  };
}
color_picker.onclick = function () {
  console.log("hej");
};
function start() {
  let socket = io();
  window.focus;
  let myCanvas = document.getElementById("myCanvas");
  let c = myCanvas.getContext("2d");
  myCanvas.width = 960;
  myCanvas.height = 540;
  c.font = "20px Arial";
  c.textAlign = "center";
  menu = document.getElementById("menu");

  class Player {
    constructor({ name, position, velocity, color, size, gravity }) {
      this.name = name;
      this.position = position;
      this.velocity = velocity;
      this.color = color;
      this.size = size;
      this.gravity = gravity;
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
        this.gravity = 0.7;
      } else {
        this.velocity.y += this.gravity;
      }
      if (
        this.velocity.y >= -1 &&
        this.velocity.y <= 1 &&
        this.velocity.y != 0
      ) {
        this.gravity = 2.1;
      }
    }
  }

  const player = new Player({
    name: userName,
    color: color,
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
    gravity: 0.7,
  });

  socket.emit("playerData", player);
  let id;
  socket.on("idToClient", (data) => {
    id = data;
  });

  class OnlinePlayer {
    constructor(name, position, velocity, color, size, gravity, id) {
      this.name = name;
      this.position = position;
      this.velocity = velocity;
      this.color = color;
      this.size = size;
      this.gravity = gravity;
      this.id = id;
    }

    render() {
      c.fillStyle = this.color;
      c.fillRect(this.position.x, this.position.y, this.size.x, this.size.y);
      c.fillStyle = "black";
      c.fillText(this.name, this.position.x + 25, this.position.y - 20);
    }

    update() {
      this.render();
      this.position.x += this.velocity.x;
      this.position.y += this.velocity.y;

      if (this.position.y + this.size.y + this.velocity.y > myCanvas.height) {
        this.velocity.y = 0;
        this.gravity = 0.7;
      } else {
        this.velocity.y += this.gravity;
      }
      if (
        this.velocity.y >= -1 &&
        this.velocity.y <= 1 &&
        this.velocity.y != 0
      ) {
        this.gravity = 2.1;
      }
    }
  }

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
        upPressed = true;

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
        player.gravity = 2.1;
        socket.emit("playerGravity", player);
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
  socket.on("OnlinePlayerGravity", (data) => {
    for (let i = 0; i < players.length; i++) {
      if (players[i].name == data.name) {
        players[i].gravity = data.gravity;
        break;
      }
    }
  });

  socket.on("PlayerPosUpdate", (data) => {
    for (let i = 0; i < players.length; i++) {
      if (players[i].name == data.name) {
        players[i].position.x = data.position.x;
        players[i].position.y = data.position.y;
        break;
      }
    }
  });

  function load() {
    for (let i = 0; i < players_connected.length; i++) {
      if (players_connected[i][1] != id) {
        players.push(
          new OnlinePlayer(
            players_connected[i][0].name,
            players_connected[i][0].position,
            players_connected[i][0].velocity,
            players_connected[i][0].color,
            players_connected[i][0].size,
            players_connected[i][0].gravity,
            players_connected[i][1]
          )
        );
      }
    }
  }

  function animate() {
    requestAnimationFrame(animate);
    c.clearRect(0, 0, innerWidth, innerHeight);
    // if (x < 2.5 && upPressed) {
    //   x += 0.2;
    //   player.velocity.y -= 0.8 * (5 * x - 2 * x ** 2);
    //   socket.emit("playerMovementY", player);
    // } else {
    //   upPressed = false;
    //   x = 0;
    //   socket.emit("playerMovementY", player);
    // }
    if (
      player.position.y + player.size.y + player.velocity.y >
      myCanvas.height
    ) {
      if (upPressed) {
        player.velocity.y = -20;
        player.gravity = 0.7;
        socket.emit("playerMovementY", player);
        socket.emit("playerGravity", player);
      }
    }
    player.update();
    for (let i = 0; i < players.length; i++) {
      players[i].update();
    }
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
        data[0].name,
        data[0].position,
        data[0].velocity,
        data[0].color,
        data[0].size,
        data[0].gravity,
        data[1]
      )
    );
  });

  socket.on("disconnected", (data) => {
    for (let i = 0; i < players.length; i++) {
      if (data == players[i].id) {
        players.splice(i, 1);
        break;
      }
    }
  });
}
startBtn = document.getElementById("start");
error = document.getElementById("error");
startBtn.onclick = function () {
  userName = document.getElementById("userName").value;
  if (color != "" && userName != "") {
    menu.style.display = "none";
    myCanvas.style.display = "block";
    start();
  } else if (color == "" && userName == "") {
    error.innerHTML = "Pick a name and color before starting!";
  } else if (color == "") {
    error.innerHTML = "Pick a color before starting";
  } else if (userName == "") {
    error.innerHTML = "Pick a name before starting";
  }
  error.style.display = "block";
};
