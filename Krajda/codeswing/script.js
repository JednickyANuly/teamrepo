// Objekt, který sleduje stav kláves
let keys = {};

// Funkce, která se spustí při stisknutí klávesy
window.addEventListener("keydown", function(event) {
  keys[event.code] = true;
});

// Funkce, která se spustí při uvolnění klávesy
window.addEventListener("keyup", function(event) {
  keys[event.code] = false;
});

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let poziceX = 0

const kreslit = ()=> {
    ctx.clearRect(0, 0, canvas.width, canvas.height) ;
    console.log(poziceX)
ctx.fillStyle = "red";
ctx.fillRect(poziceX, 0, 150, 150);

if (keys["ArrowLeft"]) {
    poziceX -= 1
}
if (keys["ArrowRight"]) {
    poziceX += 1
}

requestAnimationFrame(kreslit)
}

requestAnimationFrame(kreslit)
