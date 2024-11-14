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



// const platno = document.getElementById("platno")
const ctx = platno.getContext("2d");

let poziceX = 1

const kreslit = ()=>{
    ctx.clearRect(0,0, platno.width, platno.height);
    console.log(poziceX)
ctx.fillStyle = "blue";
ctx.fillRect  (poziceX,0,150,200);
if (keys["ArrowLeft"]) {
    poziceX -= 1
}
if (keys["ArrowRight"]) {
    poziceX += 1
}

 requestAnimationFrame(kreslit)
}




 requestAnimationFrame(kreslit)










