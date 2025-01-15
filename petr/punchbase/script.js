// Objekt, který sleduje stav kláves
let keys = {};

//const img1 = fetch('batman-robin-1.jpg');
//console.log(img1);

// Funkce, která se spustí při stisknutí klávesy
window.addEventListener("keydown", function(event) {
  keys[event.code] = true;
});

// Funkce, která se spustí při uvolnění klávesy
window.addEventListener("keyup", function(event) {
  keys[event.code] = false;
});

const platno = document.getElementById("platno")
const ctx = platno.getContext("2d");

let poziceX = 0

const kreslit = () => {
    ctx.clearRect(0, 0, platno.width, platno.height);
    //console.log('   ')
ctx.fillStyle = "blue";
ctx.fillRect(poziceX, 0, 150, 200);

if (keys["ArrowLeft"]) {
    poziceX -= 1
}
if (keys["ArrowRight"]) {
    poziceX += 1
}

requestAnimationFrame(kreslit)
}

requestAnimationFrame(kreslit)













