// Objekt, který sleduje stav kláves
let keys = {};

const img1 = new Image();
img1.src='batman-robin-1.jpg'
const img2 = new Image();
img2.src='batman-robin-2.jpg'
const slapSound = new Audio();
slapSound.src = 'slap.mp3'

const slapCounterElement = document.querySelector('.slapcounter');
let slaps = 0;

let punch = false;
const ondown = () => {
  console.log('down')
  punch = !punch;
  let s2 = slapSound.cloneNode()
  s2.play()
  slaps = slaps + 1
  slapCounterElement.innerHTML = slaps
}
window.addEventListener('pointerdown', ondown);



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
  try {
    

    //if (!img1.complete || !img2.complete) return;
    ctx.clearRect(0, 0, platno.width, platno.height);
    //console.log('   ')
    ctx.drawImage(punch ? img1 : img2, 0,0,250,250);
ctx.fillStyle = "blue";
//ctx.fillRect(poziceX, 0, 150, 200);

if (keys["ArrowLeft"]) {
    poziceX -= 1
}
if (keys["ArrowRight"]) {
    poziceX += 1
}
} catch (error) {
    
}
requestAnimationFrame(kreslit)

}

requestAnimationFrame(kreslit)













