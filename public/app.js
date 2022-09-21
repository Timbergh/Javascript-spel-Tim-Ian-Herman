let socket = io();

window.focus;
let myCanvas = document.getElementById("myCanvas");
let c = myCanvas.getContext("2d");
myCanvas.width = 960;
myCanvas.height = 540;

class Player {
  constructor({ name, position, velocity }) {
    this.name = name;
    this.position = position;
    this.velocity = velocity;
  }
}
userName = prompt("enter ur name");
const player = new Player({
  name: userName,
  position: {
    x: 0,
    y: 0,
  },
  velocity: {
    x: 0,
    y: 0,
  },
});
socket.emit("playerData", player);
c.fillStyle = "red";
c.fillRect(300, 300, 50, 200);

function animate() {
  requestAnimationFrame(animate);
  c.clearRect(0, 0, innerWidth, innerHeight);
}
