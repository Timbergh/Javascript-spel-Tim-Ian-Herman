let color = "";
let first = false;
let second = false;
let started = false;
let snapDeg = 20;
let buildmode = document.getElementById("build");
color_picker = document.getElementsByClassName("size");
for (let i = 0; i < color_picker.length; i++) {
  color_picker[i].onclick = function () {
    color = color_picker[i].classList[0];
    color = color.split("");
    color[0] = "#";
    color = color.join("");
    if (first == false) {
      if (color == "#cc6155") {
        first = true;
      } else {
        first = false;
      }
    }
    if (second == false) {
      if (first == true && color == "#f4cf40" && second == false) {
        second = true;
      } else {
        second = false;
      }
    }
    if (second == true && color == "#f0f3f4") {
      color = "#fbf3cf";
    }

    color_picker[i].style.border = "1px white solid";
    for (let j = 0; j < color_picker.length; j++) {
      if (j != i) {
        color_picker[j].style.border = "0px";
      }
    }
  };
}

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

  class Line {
    constructor(x1, y1, x2, y2, lineColor, width) {
      this.x1 = x1;
      this.y1 = y1;
      this.x2 = x2;
      this.y2 = y2;
      this.lineColor = lineColor;
      this.width = width;
      this.isHorizontal = y1 == y2;
      this.isVertical = x1 == x2;
      this.isDiagonal = !(this.isVertical || this.isHorizontal);
    }

    render() {
      c.beginPath();
      c.moveTo(this.x1, this.y1);
      c.lineTo(this.x2, this.y2);
      c.lineWidth = this.width;
      c.strokeStyle = this.lineColor;
      c.stroke();
    }
    renderPath() {
      c.beginPath();
      c.moveTo(this.x1, this.y1);
      c.lineTo(this.x2 - (this.x2 % snapDeg), this.y2 - (this.y2 % snapDeg));
      c.lineWidth = this.width;
      c.strokeStyle = this.lineColor;
      c.stroke();
    }
  }

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

  let firstClick = false;
  let lines = [];
  let paths = [];
  if (buildmode.checked) {
    let continuePath = false;
    document.addEventListener("click", (e) => {
      let rect = myCanvas.getBoundingClientRect();
      if (!firstClick) {
        if (!continuePath) {
          mouseX = e.clientX - rect.left;
          mouseY = e.clientY - rect.top;
          mouseX = mouseX - (mouseX % snapDeg);
          mouseY = mouseY - (mouseY % snapDeg);
        } else {
          mouseX = mouseX2;
          mouseY = mouseY2;
        }
        paths.push(
          new Line(
            mouseX,
            mouseY,
            e.clientX - rect.left,
            e.clientY - rect.top,
            "gray",
            3
          )
        );
        firstClick = true;
      } else {
        mouseX2 = e.clientX - rect.left;
        mouseY2 = e.clientY - rect.top;
        mouseX2 = mouseX2 - (mouseX2 % snapDeg);
        mouseY2 = mouseY2 - (mouseY2 % snapDeg);
        firstClick = false;
        paths = [];
        lines.push(new Line(mouseX, mouseY, mouseX2, mouseY2, "black", 3));
        if (started) {
          lines.pop();
          started = false;
        }
        console.log(lines);
      }
    });

    document.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "Shift":
          continuePath = true;
          break;
        case "z":
          lines.pop();
          break;
      }
    });

    document.addEventListener("keyup", (e) => {
      switch (e.key) {
        case "Shift":
          continuePath = false;
          firstClick = false;
          paths = [];
          break;
      }
    });
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

  document.addEventListener("mousemove", (e) => {
    let rect = myCanvas.getBoundingClientRect();
    try {
      paths[0].x2 = e.clientX - rect.left;
      paths[0].y2 = e.clientY - rect.top;
    } catch (error) {
      // pass
    }
  });

  function collision(x1, y1, x2, y2, x3, y3, x4, y4) {
    let uA =
      ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) /
      ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
    let uB =
      ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) /
      ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
    if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
      let intersectionX = x1 + uA * (x2 - x1);
      let intersectionY = y1 + uA * (y2 - y1);
      return [true, intersectionX, intersectionY];
    }
    return [false, 0, 0];
  }

  let onPlatform = false;
  function animate() {
    requestAnimationFrame(animate);
    c.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = 0; i < lines.length; i++) {
      lines[i].render();
    }
    try {
      paths[0].renderPath();
    } catch (error) {
      // pass
    }
    if (
      player.position.y + player.size.y + player.velocity.y > myCanvas.height ||
      onPlatform
    ) {
      if (upPressed) {
        player.velocity.y = -20;
        player.gravity = 0.7;
        socket.emit("playerMovementY", player);
        socket.emit("playerGravity", player);
        onPlatform = false;
      }
    }

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].isDiagonal) {
        let leftCollision = collision(
          player.position.x,
          player.position.y,
          player.position.x,
          player.position.y + player.size.y,
          lines[i].x1,
          lines[i].y1,
          lines[i].x2,
          lines[i].y2
        );
        let rightCollision = collision(
          player.position.x + player.size.x,
          player.position.y,
          player.position.x + player.size.x,
          player.position.y + player.size.y,
          lines[i].x1,
          lines[i].y1,
          lines[i].x2,
          lines[i].y2
        );
        let topCollision = collision(
          player.position.x,
          player.position.y,
          player.position.x + player.size.x,
          player.position.y,
          lines[i].x1,
          lines[i].y1,
          lines[i].x2,
          lines[i].y2
        );
        let bottomCollision = collision(
          player.position.x,
          player.position.y + player.size.y,
          player.position.x + player.size.x,
          player.position.y + player.size.y,
          lines[i].x1,
          lines[i].y1,
          lines[i].x2,
          lines[i].y2
        );
        if (topCollision[0]) {
          player.position.y = topCollision[2] + lines[i].width + 5;
          player.velocity.y = 0;
        } else if (leftCollision[0]) {
          onPlatform = true;
          player.position.y = leftCollision[2] - player.size.y - lines[i].width;
          player.velocity.y = 0;
        } else if (rightCollision[0]) {
          onPlatform = true;
          player.position.y =
            rightCollision[2] - player.size.y - lines[i].width;
          player.velocity.y = 0;
        } else if (bottomCollision[0]) {
          onPlatform = true;
          player.position.y =
            bottomCollision[2] - player.size.y - lines[i].width;
          player.velocity.y = 0;
        }
      }
      if (!lines[i].isDiagonal) {
        if (
          (player.position.y + player.size.y + player.velocity.y >=
            lines[i].y1 &&
            player.position.y <= lines[i].y1 &&
            player.position.x + player.size.x >= lines[i].x1 &&
            player.position.x <= lines[i].x2) ||
          (player.position.y + player.size.y + player.velocity.y >=
            lines[i].y1 &&
            player.position.y <= lines[i].y1 &&
            player.position.x + player.size.x >= lines[i].x2 &&
            player.position.x <= lines[i].x1)
        ) {
          player.velocity.y = 0;
          onPlatform = true;
        }
        if (
          (player.position.x + player.size.x >= lines[i].x1 &&
            player.position.x <= lines[i].x1 &&
            player.position.y + player.size.y >= lines[i].y1 &&
            player.position.y <= lines[i].y2) ||
          (player.position.x + player.size.x >= lines[i].x2 &&
            player.position.x <= lines[i].x2 &&
            player.position.y + player.size.y >= lines[i].y2 &&
            player.position.y <= lines[i].y1)
        ) {
          player.velocity.x = 0;
          let playerCenter = player.position.x + player.size.x / 2;
          if (lines[i].x1 - playerCenter > 0) {
            player.position.x -= 1;
          } else {
            player.position.x += 1;
          }
        }
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
    started = true;
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
