const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let poziceX = 0

const kresli = ()=> {
    ctx.clearRect(0, 0, canvas.width, canvas.height) ;
    console.log(poziceX)
ctx.fillStyle = "red";
ctx.fillRect(poziceX, 0, 150, 150);
poziceX = poziceX + 1
if (poziceX > 100) {
    poziceX = 0
    
}
requestAnimationFrame(kresli)
 }

requestAnimationFrame(kresli)

