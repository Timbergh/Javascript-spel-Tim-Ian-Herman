let color = "";
let first = false;
let second = false;
let snapDeg = 20;
let chat = false;
let chatters = [];
let started = false;
let buildmode = document.getElementById("build");
color_picker = document.getElementsByClassName("size");
let cursor = document.getElementById("cursor");
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
  let message = document.getElementById("message");
  let myCanvas = document.getElementById("myCanvas");
  let c = myCanvas.getContext("2d");
  myCanvas.width = 960;
  myCanvas.height = 540;
  c.font = "20px Arial";
  c.textalign = "center";
  menu = document.getElementById("menu");
  message.style.top = myCanvas.height;

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
      this.angle = 0;
    }

    render() {
      // Gör så att linjerna altid är åt samma riktning, oavsätt vilket håll man gör dem åt
      let rememberX1 = this.x1;
      let rememberX2 = this.x2;
      let rememberY1 = this.y1;
      let rememberY2 = this.y2;
      if (this.x1 > this.x2) {
        this.x1 = rememberX2;
        this.x2 = rememberX1;
        this.y1 = rememberY2;
        this.y2 = rememberY1;
      }
      c.beginPath();
      c.moveTo(this.x1, this.y1);
      c.lineTo(this.x2, this.y2);
      c.lineWidth = this.width;
      c.strokeStyle = this.lineColor;
      c.stroke();
      this.angle = Math.atan((this.y2 - this.y1) / (this.x2 - this.x1));
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
      this.walkingDiagonal = false;
      this.playerAngle = 0;
      this.rotationSpeed = 0;
      this.tooSteepLeft = false;
      this.tooSteepRight = false;
      this.onPlatform = false;
      for (let i = 0; i < lines.length; i++) {
        this.hitboxright =
          this.y1 -
          (this.position.x + this.size.x - lines[i].x1) *
            -((lines[i].y2 - lines[i].y1) / (lines[i].x2 - lines[i].x1));
        this.hitboxleft =
          this.y1 -
          (this.position.x - lines[i].x1) *
            -((lines[i].y2 - lines[i].y1) / (lines[i].x2 - lines[i].x1));
      }
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
        this.velocity.y = myCanvas.height - (this.position.y + this.size.y);
        this.position.y += this.velocity.y;
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

      for (let i = 0; i < lines.length; i++) {
        if (
          this.position.x + this.size.x >= lines[i].x1 &&
          this.position.x + this.size.x <= lines[i].x2
        ) {
          this.hitboxright =
            lines[i].y1 -
            (this.position.x + this.size.x - lines[i].x1) *
              -((lines[i].y2 - lines[i].y1) / (lines[i].x2 - lines[i].x1));
        } else {
          this.hitboxright = "";
        }
        if (this.position.x >= lines[i].x1 && this.position.x <= lines[i].x2) {
          this.hitboxleft =
            lines[i].y1 -
            (this.position.x - lines[i].x1) *
              -((lines[i].y2 - lines[i].y1) / (lines[i].x2 - lines[i].x1));
        } else {
          this.hitboxleft = "";
        }

        // Collision
        let hitbox = "";
        let hitboxup = Math.max(this.hitboxright, this.hitboxleft);
        if (this.hitboxright != "" && this.hitboxleft != "") {
          hitbox = Math.min(this.hitboxright, this.hitboxleft);
        } else if (this.hitboxright == "") {
          hitbox = this.hitboxleft;
        } else if (this.hitboxleft == "") {
          hitbox = this.hitboxright;
        }
        if (
          (lines[i].isVertical &&
            this.position.y + this.size.y + this.velocity.y >=
              Math.min(lines[i].y1, lines[i].y2) &&
            this.position.y + this.size.y <=
              Math.min(lines[i].y1, lines[i].y2) &&
            this.position.x + this.size.x >= lines[i].x1 &&
            this.position.x <= lines[i].x1) ||
          (this.position.y + this.size.y + this.velocity.y >= lines[i].y1 &&
            this.position.y <= lines[i].y1 &&
            this.position.x + this.size.x >= lines[i].x1 &&
            this.position.x <= lines[i].x2 &&
            lines[i].isDiagonal == false &&
            lines[i].isVertical == false) ||
          (this.position.y + this.size.y + this.velocity.y >= lines[i].y1 &&
            this.position.y <= lines[i].y1 &&
            this.position.x + this.size.x >= lines[i].x2 &&
            this.position.x <= lines[i].x1 &&
            lines[i].isDiagonal == false &&
            lines[i].isVertical == false) ||
          (this.position.y + this.size.y + this.velocity.y >= hitbox &&
            this.position.y <= hitbox &&
            this.position.x + this.size.x >= lines[i].x1 &&
            this.position.x <= lines[i].x2 &&
            lines[i].isDiagonal)
        ) {
          if (lines[i].isHorizontal) {
            this.velocity.y = lines[i].y1 - (this.position.y + this.size.y);
          } else if (lines[i].isDiagonal) {
            this.velocity.y = hitbox - (this.position.y + this.size.y);
          } else if (lines[i].isVertical) {
            this.velocity.y =
              Math.min(lines[i].y1, lines[i].y2) -
              (this.position.y + this.size.y);
          }
          this.position.y += this.velocity.y;
          this.velocity.y = 0;
          this.onPlatform = true;
        }
        if (
          this.position.y + this.velocity.y <= hitboxup &&
          this.position.y >= hitboxup &&
          this.position.x + this.size.x >= lines[i].x1 &&
          this.position.x <= lines[i].x2
        ) {
          this.velocity.y = -(this.position.y - hitboxup - lines[i].width);
          // this.position.y += this.velocity.y;
          this.velocity.y = 0;
        }

        // Vertical
        if (
          (this.position.x + this.size.x >= lines[i].x1 &&
            this.position.x <= lines[i].x1 &&
            this.position.y + this.size.y > lines[i].y1 &&
            this.position.y < lines[i].y2 &&
            lines[i].isDiagonal == false) ||
          (this.position.x + this.size.x >= lines[i].x2 &&
            this.position.x <= lines[i].x2 &&
            this.position.y + this.size.y > lines[i].y2 &&
            this.position.y < lines[i].y1 &&
            lines[i].isDiagonal == false)
        ) {
          this.velocity.x = 0;
        }
      }
    }
  }

  class OnlinePlayer extends Player {
    constructor(name, position, velocity, color, size, gravity, id) {
      super({ name, position, velocity, color, size, gravity });
      this.id = id;
    }
  }

  let firstClick = false;
  let lines = [];
  let paths = [];
  let redo = [];
  let undo = false;
  let rect = myCanvas.getBoundingClientRect();

  if (buildmode.checked) {
    let continuePath = false;
    document.addEventListener("click", (e) => {
      if (
        e.clientX > rect.left - 1 &&
        e.clientX < rect.left + myCanvas.width + 10 &&
        e.clientY > rect.top - 1 &&
        e.clientY < rect.top + myCanvas.height + 10
      ) {
        if (started) {
          if (!firstClick) {
            if (!continuePath) {
              mouseX = e.clientX - rect.left;
              mouseY = e.clientY - rect.top;
              mouseX = mouseX - (mouseX % snapDeg);
              mouseY = mouseY - (mouseY % snapDeg);
              rememberMouseX = mouseX;
              rememberMouseY = mouseY;
            } else {
              if (undo) {
                mouseX = lines[lines.length - 1].x2;
                mouseY = lines[lines.length - 1].y2;
                undo = false;
              } else {
                mouseX = mouseX2;
                mouseY = mouseY2;
              }
            }
            paths.push(
              new Line(
                mouseX,
                mouseY,
                e.clientX - rect.left,
                e.clientY - rect.top,
                "gray",
                5
              )
            );
            firstClick = true;
          } else {
            mouseX2 = e.clientX - rect.left;
            mouseY2 = e.clientY - rect.top;
            mouseX2 = mouseX2 - (mouseX2 % snapDeg);
            mouseY2 = mouseY2 - (mouseY2 % snapDeg);
            rememberMouseX2 = mouseX2;
            rememberMouseY2 = mouseY2;
            firstClick = false;
            paths = [];
            console.log(lines);
            socket.emit("lineData", {
              x: mouseX,
              y: mouseY,
              x2: mouseX2,
              y2: mouseY2,
            });
          }
        }
      }
    });

    socket.on("lineList", (data) => {
      lines = [];
      for (let i = 0; i < data.length; i++) {
        lines.push(
          new Line(data[i].x, data[i].y, data[i].x2, data[i].y2, "black", 5)
        );
      }
    });
    socket.on("undoLine", () => {
      if (lines > 0) {
        lines.pop();
      }
    });

    document.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "Shift":
          continuePath = true;
          break;
        case "z":
        case "Z":
          socket.emit("lineUndo");
          undo = true;
          break;
        case "y":
        case "Y":
          if (redo.length > 0) {
            lines.push(
              new Line(
                redo[redo.length - 1].x1,
                redo[redo.length - 1].y1,
                redo[redo.length - 1].x2,
                redo[redo.length - 1].y2,
                "black",
                5
              )
            );
            redo.pop();
          }
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
      x: 40,
      y: 60,
    },
    gravity: 0.7,
  });

  socket.emit("playerData", player);
  let id;
  socket.on("idToClient", (data) => {
    id = data;
  });

  let aPressed = false;
  let dPressed = false;
  let upPressed = false;

  function chatBubble(y, x, text) {
    c.beginPath();
    c.lineWidth = "4";
    c.moveTo(x + player.size.x / 2, y - 10);
    c.lineTo(x + player.size.x, y - 25);
    c.lineTo(x + player.size.x / 2 + 75, y - 25);
    c.lineTo(x + player.size.x / 2 + 75, y - 50);
    c.lineTo(x + player.size.x / 2 - 75, y - 50);
    c.lineTo(x + player.size.x / 2 - 75, y - 25);
    c.lineTo(x, y - 25);
    c.lineTo(x + player.size.x / 2, y - 10);
    c.closePath();
    c.fillStyle = "white";
    c.fill();
    c.font = "15px Arial";
    c.fillStyle = "black";
    c.fillText(text, x - 40, y - 32);
    c.strokeStyle = "black";
    c.stroke();
  }
  document.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "a":
      case "A":
        if (!aPressed) {
          player.velocity.x = -5;
          socket.emit("playerMovementX", player);
          aPressed = true;
        }
        break;
      case "d":
      case "D":
        if (!dPressed) {
          player.velocity.x = 5;
          socket.emit("playerMovementX", player);
          dPressed = true;
        }
        break;
      case " ":
        upPressed = true;
        break;
      case "Enter":
        if (chat == true) {
          input = document.getElementById("message").value;
          message.style.display = "none";
          chat = false;
          console.log(input);
          socket.emit("OnlineMessage", input);
        } else {
          message.style.bottom = rect.top + "px";
          message.style.left = rect.left + "px";
          message.style.display = "block";
          chat = true;
        }
    }
  });

  document.addEventListener("keyup", (e) => {
    switch (e.key) {
      case "a":
      case "A":
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
      case "D":
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
    try {
      paths[0].x2 = e.clientX - rect.left;
      paths[0].y2 = e.clientY - rect.top;
    } catch (error) {
      // pass
    }
  });

  let lisa = [];

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
      player.onPlatform
    ) {
      if (upPressed) {
        player.velocity.y = -20;
        player.gravity = 0.7;
        socket.emit("playerMovementY", player);
        socket.emit("playerGravity", player);
        player.onPlatform = false;
      }
    }
    if (
      player.position.y + player.size.y + player.velocity.y > myCanvas.height ||
      !player.onPlatform
    ) {
      let angleDiff = 0 - player.playerAngle;
      if (Math.abs(angleDiff) > 0.01) {
        player.playerAngle += angleDiff * player.rotationSpeed;
      }
    }

    if (player.tooSteepLeft) {
      player.position.x += 2;
      player.velocity.y = 0;
      if (aPressed || dPressed) {
        player.velocity.x = 0;
      }
    }
    if (player.tooSteepRight) {
      player.position.x -= 2;
      player.velocity.y = 0;
      if (aPressed || dPressed) {
        player.velocity.x = 0;
      }
    }

    player.update();
    for (let i = 0; i < players.length; i++) {
      players[i].update();
    }
    if (chatters.length > 0) {
      for (let i = 0; i < chatters.length; i++) {
        for (let j = 0; j < players.length; j++) {
          if (chatters[i][1] == players[j].id) {
            chatBubble(
              players[j].position.y,
              players[j].position.x,
              chatters[i][0]
            );
            if (lisa.length < lisa.length + 1)
              lisa = setTimeout(() => {
                for (let i = 0; i < chatters.length; i++) {
                  if (chatters[i][1] == players[j].id) {
                    sak = i;
                    break;
                  }
                }
                console.log(sak);
                chatters.splice(sak, 1);
                for (let i = 0; i < lisa.length; i++) {
                  clearTimeout(lisa[i]);
                  lisa.splice(i, 1);
                }
              }, 2000);
          }
        }
      }
    }
    if (buildmode.checked) {
      for (let x = 0; x < myCanvas.width; x += snapDeg) {
        if (x % snapDeg === 0) {
          c.strokeStyle = "rgba(0, 0, 0, 0.5)";
          c.lineWidth = 1;
          c.beginPath();
          c.moveTo(x, 0);
          c.lineTo(x, myCanvas.height);
          c.stroke();
        }
      }

      for (let y = 0; y < myCanvas.height; y += snapDeg) {
        if (y % snapDeg === 0) {
          c.beginPath();
          c.moveTo(0, y);
          c.lineTo(myCanvas.width, y);
          c.stroke();
        }
      }
    }
  }
  document.addEventListener("mousemove", function (e) {
    let mouseX = e.clientX - rect.left;
    let mouseY = e.clientY - rect.top;
    let snappedX = mouseX - (mouseX % snapDeg);
    let snappedY = mouseY - (mouseY % snapDeg);

    cursor.style.left = snappedX + rect.left + "px";
    cursor.style.top = snappedY + rect.top + "px";
    if (
      e.clientX > rect.left - 1 &&
      e.clientX < rect.left + myCanvas.width + 10 &&
      e.clientY > rect.top - 1 &&
      e.clientY < rect.top + myCanvas.height + 10
    ) {
      cursor.style.visibility = "visible";
    } else {
      cursor.style.visibility = "hidden";
    }
  });

  socket.emit("loadPlayers");
  socket.on("playerList", (data) => {
    players_connected = data;
    load();
    animate();
    started = true;
  });
  socket.on("lineListLoad", (data) => {
    for (let i = 0; i < data.length; i++) {
      lines.push(
        new Line(data[i].x, data[i].y, data[i].x2, data[i].y2, "black", 5)
      );
    }
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
  socket.on("MessageReceived", (data) => {
    chatters.push([data[0], data[1]]);
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
