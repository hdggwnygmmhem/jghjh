import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

const ANGRY_HTML = `<style>
*{box-sizing:border-box;margin:0;padding:0;font-family:'Trebuchet MS','Segoe UI',Arial,sans-serif;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}
html,body{width:100%;height:100%;margin:0;overflow:hidden}
body{background:radial-gradient(circle at 50% 20%,#3b4267 0%,#171a2d 70%);display:flex;justify-content:center;align-items:center;padding:8px}
#app{width:460px;max-width:100%}
.game{position:relative;overflow:hidden;border-radius:20px;background:#8ed6f5;border:3px solid #111827;box-shadow:0 18px 50px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.35)}
canvas{width:100%;height:auto;display:block;touch-action:none}
.info{color:#d8deef;text-align:center;font-size:11px;margin-top:7px;opacity:.8}
</style>
<div id="app">
<div class="game"><canvas id="cv" width="460" height="620"></canvas></div>
<div class="info">🐦 Tarik burung • Lepaskan untuk menembak • Level unlimited!</div>
</div>
<script>
(function(){
var cv=document.getElementById('cv'),ctx=cv.getContext('2d');
var W=460,H=620,DPR=Math.min(window.devicePixelRatio||1,2);
cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);

var score=0,high=0,level=1,birdsLeft=4;
try{high=parseInt(localStorage.getItem('angry_high')||'0',10)||0}catch(e){}

var gravity=0.32;
var sling={x:105,y:455};
var blocks=[],pigs=[],particles=[],texts=[],clouds=[];
var bird=null,dragging=false,pointer={x:0,y:0};
var state='ready',shake=0,frame=0,levelTimer=null,hasLaunched=false;

var AC=null,MUTED=false;
try{MUTED=localStorage.getItem('angry_mute')==='1'}catch(e){}
function ac(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){return null}}if(AC&&AC.state==='suspended'){try{AC.resume()}catch(e){}}return AC}
function tone(f,d,t,v,at,sl){var a=AC;if(!a||MUTED)return;try{var n=a.currentTime+(at||0),o=a.createOscillator(),g=a.createGain();o.type=t||'sine';o.frequency.setValueAtTime(f,n);if(sl)o.frequency.exponentialRampToValueAtTime(sl,n+d);g.gain.setValueAtTime(v||.1,n);g.gain.exponentialRampToValueAtTime(.0001,n+d);o.connect(g);g.connect(a.destination);o.start(n);o.stop(n+d+.03)}catch(e){}}
function sfxStretch(){tone(200,.08,'sawtooth',.08,0,300)}
function sfxLaunch(){tone(400,.15,'sine',.2,0,800);tone(600,.1,'square',.1,.05)}
function sfxWoodBreak(){tone(180,.12,'sawtooth',.15,0,100);tone(120,.15,'sawtooth',.12,.04,80)}
function sfxStoneBreak(){tone(300,.15,'square',.12,0,200);tone(200,.2,'sawtooth',.1,.06,100)}
function sfxGlassBreak(){tone(700,.1,'triangle',.15,0,500);tone(900,.12,'triangle',.1,.03,600)}
function sfxPigPop(){tone(600,.1,'sine',.2,0,900);tone(800,.15,'sine',.15,.04,1200)}
function sfxLevelClear(){[600,800,1000,1200].forEach(function(f,i){tone(f,.15,'square',.15,i*.12)})}
function sfxGameOver(){[500,400,300,200].forEach(function(f,i){tone(f,.2,'sawtooth',.15,i*.15)})}

function rand(a,b){return a+Math.random()*(b-a)}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function distance(a,b){var dx=a.x-b.x,dy=a.y-b.y;return Math.sqrt(dx*dx+dy*dy)}
function addScore(value,x,y){score+=value;texts.push({x:x,y:y,value:'+'+value,life:1,vy:-1.3,color:value>=500?'#ffe34d':'#fff'});if(score>high){high=score;try{localStorage.setItem('angry_high',String(high))}catch(e){}}}
function burst(x,y,color,count){count=count||12;for(var i=0;i<count;i++){var a=Math.random()*Math.PI*2,s=rand(1,6);particles.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-rand(0,2),life:1,size:rand(2,6),color:color,rot:rand(0,Math.PI*2),vr:rand(-.2,.2)})}}
function screenShake(power){shake=Math.max(shake,power)}

function initClouds(){clouds=[];for(var i=0;i<7;i++)clouds.push({x:rand(-100,W),y:rand(45,220),s:rand(.55,1.25),speed:rand(.08,.25)})}
function drawCloud(c){ctx.save();ctx.globalAlpha=.72;ctx.fillStyle='#fff';var x=c.x,y=c.y,s=c.s;ctx.beginPath();ctx.arc(x,y,22*s,0,Math.PI*2);ctx.arc(x+28*s,y-10*s,28*s,0,Math.PI*2);ctx.arc(x+58*s,y,22*s,0,Math.PI*2);ctx.arc(x+30*s,y+10*s,25*s,0,Math.PI*2);ctx.fill();ctx.restore()}
function drawBackground(){
var sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#58bde9');sky.addColorStop(.55,'#a6e4f7');sky.addColorStop(1,'#dff7ff');
ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);clouds.forEach(drawCloud);
ctx.fillStyle='#73b85a';ctx.beginPath();ctx.moveTo(0,410);ctx.quadraticCurveTo(70,330,145,410);ctx.quadraticCurveTo(235,320,320,405);ctx.quadraticCurveTo(395,340,460,405);ctx.lineTo(460,H);ctx.lineTo(0,H);ctx.closePath();ctx.fill();
ctx.fillStyle='#5b9f48';ctx.beginPath();ctx.moveTo(0,455);ctx.quadraticCurveTo(90,375,180,455);ctx.quadraticCurveTo(270,380,365,450);ctx.quadraticCurveTo(420,410,460,445);ctx.lineTo(460,H);ctx.lineTo(0,H);ctx.closePath();ctx.fill();
var groundY=535;ctx.fillStyle='#80c94b';ctx.fillRect(0,groundY,W,H-groundY);ctx.fillStyle='#65ad3c';ctx.fillRect(0,groundY,W,13);
ctx.strokeStyle='#4d9635';ctx.lineWidth=2;for(var x=0;x<W;x+=12){ctx.beginPath();ctx.moveTo(x,groundY+12);ctx.lineTo(x+3,groundY+5);ctx.stroke()}
}

function generateRandomLevel(){
blocks=[];pigs=[];
birdsLeft=Math.min(6,3+Math.floor(level/4));
var difficulty=Math.min(0.8,level/10);
var numStructures=1+Math.floor(Math.random()*2);
if(difficulty>0.3)numStructures=2+Math.floor(Math.random()*2);
if(difficulty>0.6)numStructures=3;

var usedX=[];
for(var s=0;s<numStructures;s++){
var baseX=230+Math.floor(Math.random()*140);
if(usedX.some(function(ux){return Math.abs(ux-baseX)<80})){s--;continue;}
usedX.push(baseX);

var structureHeight=1+Math.floor(Math.random()*2);
if(difficulty>0.5)structureHeight=2+Math.floor(Math.random()*2);
if(difficulty>0.7)structureHeight=3;

var currentY=500;
for(var t=0;t<structureHeight;t++){
var numBlocks=2;
var blockType=Math.random();
if(difficulty<0.2)blockType='wood';
else if(difficulty<0.5)blockType=Math.random()<.6?'wood':'stone';
else blockType=Math.random()<.4?'wood':(Math.random()<.5?'stone':'glass');

var blkW=22,blkH=55;
if(blockType==='glass')blkH=16;
var spacing=blkW+10;
for(var b=0;b<numBlocks;b++){
var bx=baseX+(b-Math.floor(numBlocks/2))*spacing;
var hp=blockType==='wood'?1:blockType==='stone'?2:1;
if(difficulty>0.5)hp+=1;
if(blockType==='wood')wood(bx,currentY,blkW,blkH,hp);
else if(blockType==='stone')stone(bx,currentY,blkW,blkH,hp);
else glass(bx,currentY,blkW,blkH,hp);
}
var pigY=currentY-blkH/2-12;
pig(baseX,pigY,14);
currentY-=blkH+15;
}
}

var groundPigX=180+Math.floor(Math.random()*80);
pig(groundPigX,510,15);
}
function setupLevel(){
clearTimeout(levelTimer);
particles=[];texts=[];
hasLaunched=false;
generateRandomLevel();
resetBird();
}
function wood(x,y,w,h,hp){blocks.push({x:x,y:y,w:w,h:h,hp:hp,maxHp:hp,type:'wood',angle:0})}
function stone(x,y,w,h,hp){blocks.push({x:x,y:y,w:w,h:h,hp:hp,maxHp:hp,type:'stone',angle:0})}
function glass(x,y,w,h,hp){blocks.push({x:x,y:y,w:w,h:h,hp:hp,maxHp:hp,type:'glass',angle:0})}
function pig(x,y,r){pigs.push({x:x,y:y,r:r,hp:1,vx:0,vy:0,wobble:Math.random()*10})}

function resetBird(){bird={x:sling.x,y:sling.y,vx:0,vy:0,radius:19,type:'red',active:true,trail:[]};state='ready';dragging=false;hasLaunched=false}
function drawBird(b){
if(!b)return;var x=b.x,y=b.y,r=b.radius;ctx.save();
ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(x+3,y+r+5,r*.8,r*.22,0,0,Math.PI*2);ctx.fill();
ctx.fillStyle='#a71919';ctx.beginPath();ctx.moveTo(x-r+5,y+2);ctx.lineTo(x-r-12,y-8);ctx.lineTo(x-r-7,y+5);ctx.lineTo(x-r-13,y+14);ctx.lineTo(x-r+6,y+11);ctx.closePath();ctx.fill();
var grad=ctx.createRadialGradient(x-r*.35,y-r*.45,2,x,y,r*1.3);grad.addColorStop(0,'#ff6259');grad.addColorStop(.6,'#e52d27');grad.addColorStop(1,'#b71919');ctx.fillStyle=grad;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
ctx.fillStyle='#f2d5a0';ctx.beginPath();ctx.arc(x,y+8,r*.68,0,Math.PI);ctx.fill();
ctx.strokeStyle='#4a1111';ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x-12,y-9);ctx.lineTo(x-2,y-13);ctx.stroke();ctx.beginPath();ctx.moveTo(x+2,y-13);ctx.lineTo(x+13,y-9);ctx.stroke();
ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x-7,y-4,5.7,0,Math.PI*2);ctx.arc(x+7,y-4,5.7,0,Math.PI*2);ctx.fill();
ctx.fillStyle='#111';ctx.beginPath();ctx.arc(x-6,y-4,2.6,0,Math.PI*2);ctx.arc(x+8,y-4,2.6,0,Math.PI*2);ctx.fill();
ctx.fillStyle='#f5a623';ctx.beginPath();ctx.moveTo(x+15,y+1);ctx.lineTo(x+31,y+5);ctx.lineTo(x+15,y+11);ctx.closePath();ctx.fill();
ctx.strokeStyle='#9a5712';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+15,y+6);ctx.lineTo(x+28,y+6);ctx.stroke();
ctx.fillStyle='rgba(255,255,255,.28)';ctx.beginPath();ctx.arc(x-8,y-11,4,0,Math.PI*2);ctx.fill();ctx.restore();
}

function drawSlingshot(){
var x=sling.x,y=sling.y;
ctx.strokeStyle='#4a2a16';ctx.lineWidth=13;ctx.lineCap='round';
ctx.beginPath();ctx.moveTo(x-4,y+45);ctx.lineTo(x-10,y-20);ctx.lineTo(x-27,y-52);ctx.stroke();
ctx.beginPath();ctx.moveTo(x+4,y+45);ctx.lineTo(x+10,y-20);ctx.lineTo(x+27,y-52);ctx.stroke();
ctx.strokeStyle='#8b542b';ctx.lineWidth=4;
ctx.beginPath();ctx.moveTo(x-5,y+38);ctx.lineTo(x-11,y-17);ctx.stroke();
ctx.beginPath();ctx.moveTo(x+5,y+38);ctx.lineTo(x+11,y-17);ctx.stroke();
if(bird&&bird.active&&!hasLaunched&&(state==='ready'||state==='aiming')){
ctx.strokeStyle='#3b2417';ctx.lineWidth=5;ctx.lineCap='round';
ctx.beginPath();ctx.moveTo(x-27,y-52);ctx.lineTo(bird.x,bird.y);ctx.lineTo(x+27,y-52);ctx.stroke();
ctx.strokeStyle='#6e3e25';ctx.lineWidth=2;
ctx.beginPath();ctx.moveTo(x-27,y-52);ctx.lineTo(bird.x,bird.y);ctx.lineTo(x+27,y-52);ctx.stroke();
}
}

function drawBlock(b){
ctx.save();var x=b.x-b.w/2,y=b.y-b.h/2;
if(b.type==='wood'){
var g=ctx.createLinearGradient(x,y,x+b.w,y+b.h);g.addColorStop(0,'#d9964b');g.addColorStop(.5,'#b96e2c');g.addColorStop(1,'#824419');
ctx.fillStyle=g;ctx.fillRect(x,y,b.w,b.h);ctx.strokeStyle='#693710';ctx.lineWidth=3;ctx.strokeRect(x+1.5,y+1.5,b.w-3,b.h-3);
ctx.strokeStyle='rgba(75,38,12,.38)';ctx.lineWidth=2;
for(var i=8;i<b.h;i+=13){ctx.beginPath();ctx.moveTo(x+4,y+i);ctx.bezierCurveTo(x+b.w*.3,y+i-4,x+b.w*.7,y+i+4,x+b.w-4,y+i);ctx.stroke()}
if(b.hp<b.maxHp){ctx.strokeStyle='#4a2610';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+b.w*.3,y+5);ctx.lineTo(x+b.w*.5,y+b.h*.45);ctx.lineTo(x+b.w*.4,y+b.h-5);ctx.stroke()}
}else if(b.type==='stone'){
var sg=ctx.createLinearGradient(x,y,x,y+b.h);sg.addColorStop(0,'#a9b0b7');sg.addColorStop(.5,'#7b838a');sg.addColorStop(1,'#555d63');
ctx.fillStyle=sg;ctx.fillRect(x,y,b.w,b.h);ctx.strokeStyle='#41474c';ctx.lineWidth=3;ctx.strokeRect(x+1.5,y+1.5,b.w-3,b.h-3);
ctx.strokeStyle='rgba(255,255,255,.2)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+4,y+8);ctx.lineTo(x+b.w-4,y+b.h-8);ctx.stroke();
}else{
ctx.fillStyle='rgba(150,235,255,.42)';ctx.fillRect(x,y,b.w,b.h);ctx.strokeStyle='#72d9f2';ctx.lineWidth=3;ctx.strokeRect(x+1,y+1,b.w-2,b.h-2);
ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+5,y+b.h-5);ctx.lineTo(x+b.w*.45,y+5);ctx.lineTo(x+b.w*.7,y+b.h*.5);ctx.lineTo(x+b.w-5,y+7);ctx.stroke();
}
ctx.restore();
}
function drawPig(p){
var bob=Math.sin(frame*.08+p.wobble)*1.2,x=p.x,y=p.y+bob,r=p.r;ctx.save();
ctx.fillStyle='#43bd58';ctx.beginPath();ctx.arc(x-r*.65,y-r*.75,r*.42,0,Math.PI*2);ctx.arc(x+r*.65,y-r*.75,r*.42,0,Math.PI*2);ctx.fill();
ctx.fillStyle='#249842';ctx.beginPath();ctx.arc(x-r*.65,y-r*.75,r*.2,0,Math.PI*2);ctx.arc(x+r*.65,y-r*.75,r*.2,0,Math.PI*2);ctx.fill();
var g=ctx.createRadialGradient(x-r*.35,y-r*.5,2,x,y,r*1.2);g.addColorStop(0,'#91ed69');g.addColorStop(.55,'#4dce59');g.addColorStop(1,'#25a849');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x-6,y-5,4.5,0,Math.PI*2);ctx.arc(x+6,y-5,4.5,0,Math.PI*2);ctx.fill();
ctx.fillStyle='#222';ctx.beginPath();ctx.arc(x-5,y-5,2,0,Math.PI*2);ctx.arc(x+7,y-5,2,0,Math.PI*2);ctx.fill();
ctx.fillStyle='#72df68';ctx.beginPath();ctx.ellipse(x,y+7,r*.62,r*.42,0,0,Math.PI*2);ctx.fill();
ctx.strokeStyle='#258c3a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x-5,y+7,2.8,0,Math.PI*2);ctx.arc(x+5,y+7,2.8,0,Math.PI*2);ctx.stroke();
ctx.beginPath();ctx.arc(x,y+9,7,.15,Math.PI-.15);ctx.stroke();ctx.restore();
}

function getLaunchVelocity(){
var dx=sling.x-bird.x,dy=sling.y-bird.y;
return {vx:dx*0.19,vy:dy*0.19};
}
function drawTrajectory(){
if(state!=='aiming'||!bird)return;
var launchVel=getLaunchVelocity();
var vx=launchVel.vx,vy=launchVel.vy;
ctx.fillStyle='rgba(255,255,255,.7)';
for(var i=0;i<40;i++){
var t=i*0.8;
var tx=sling.x+vx*t;
var ty=sling.y+vy*t+0.5*gravity*t*t;
if(tx<0||tx>W||ty<0||ty>H)break;
ctx.globalAlpha=1-i/40;
ctx.beginPath();ctx.arc(tx,ty,Math.max(2,3.5-i*.07),0,Math.PI*2);ctx.fill();
}
ctx.globalAlpha=1;
}

function circleRectCollision(c,b){
var left=b.x-b.w/2,right=b.x+b.w/2,top=b.y-b.h/2,bottom=b.y+b.h/2;
var closestX=clamp(c.x,left,right),closestY=clamp(c.y,top,bottom);
var dx=c.x-closestX,dy=c.y-closestY;
return dx*dx+dy*dy<c.radius*c.radius;
}

function updateBird(){
if(state!=='flying'||!bird)return;
bird.x+=bird.vx;
bird.y+=bird.vy;
bird.vy+=gravity;
bird.trail.push({x:bird.x,y:bird.y,life:1});
if(bird.trail.length>16)bird.trail.shift();
}

function nextBird(){
if(pigs.length===0)return;
if(birdsLeft>0){birdsLeft--;resetBird();}
else{state='gameover';sfxGameOver();if(score>high){high=score;try{localStorage.setItem('angry_high',String(high))}catch(e){}}}
}
function levelClear(){
state='levelclear';sfxLevelClear();
levelTimer=setTimeout(function(){
level++;
setupLevel();
},1500);
}

function loop(){
frame++;
ctx.clearRect(0,0,W,H);
if(shake>0){ctx.save();ctx.translate(rand(-shake,shake),rand(-shake,shake));shake*=0.9;if(shake<0.5)shake=0;}

drawBackground();

for(var i=0;i<blocks.length;i++)drawBlock(blocks[i]);
for(var j=0;j<pigs.length;j++)drawPig(pigs[j]);

drawSlingshot();
if(bird)drawBird(bird);
drawTrajectory();

for(var k=0;k<particles.length;k++){
var p=particles[k];
p.x+=p.vx;p.y+=p.vy;p.vy+=0.1;p.life-=0.02;p.rot+=p.vr;
if(p.life<=0){particles.splice(k,1);k--;continue;}
ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.globalAlpha=p.life;ctx.fillStyle=p.color;ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size);ctx.restore();
}

for(var l=0;l<texts.length;l++){
var t=texts[l];
t.y+=t.vy;t.life-=0.025;
if(t.life<=0){texts.splice(l,1);l--;continue;}
ctx.save();ctx.globalAlpha=t.life;ctx.fillStyle=t.color;ctx.font='bold 22px Trebuchet MS';ctx.textAlign='center';ctx.fillText(t.value,t.x,t.y);ctx.restore();
}

if(shake>0)ctx.restore();

if(state==='ready'||state==='aiming'){
if(bird&&!hasLaunched){
if(dragging){
var dx=pointer.x-sling.x,dy=pointer.y-sling.y;
var dist=Math.sqrt(dx*dx+dy*dy);
if(dist>80){dx=dx/dist*80;dy=dy/dist*80;}
bird.x=sling.x+dx;bird.y=sling.y+dy;
state='aiming';
}
}
}

if(state==='flying'&&bird){
updateBird();

for(var m=0;m<pigs.length;m++){
var pigObj=pigs[m];
if(circleRectCollision(bird,pigObj)){
sfxPigPop();burst(pigObj.x,pigObj.y,'#91ed69',15);
pigs.splice(m,1);m--;
addScore(500,bird.x,bird.y);
screenShake(8);
}
}

for(var n=0;n<blocks.length;n++){
var block=blocks[n];
if(circleRectCollision(bird,block)){
block.hp--;
if(block.hp<=0){
if(block.type==='wood')sfxWoodBreak();
else if(block.type==='stone')sfxStoneBreak();
else sfxGlassBreak();
burst(block.x,block.y,block.type==='wood'?'#b96e2c':block.type==='stone'?'#7b838a':'#aee6f2',15);
blocks.splice(n,1);n--;
addScore(200,bird.x,bird.y);
screenShake(5);
}else{
addScore(50,bird.x,bird.y);
}
}
}

if(bird.x>W+50||bird.y>H+100||bird.x<-50){
bird.active=false;
nextBird();
}
}

if(pigs.length===0&&state!=='levelclear'&&state!=='gameover'){
levelClear();
}

requestAnimationFrame(loop);
}

function onPointerDown(e){
if(e.touches)e=e.touches[0];
pointer.x=e.clientX||e.pageX;
pointer.y=e.clientY||e.pageY;
var rect=cv.getBoundingClientRect();
pointer.x=(pointer.x-rect.left)*(W/rect.width);
pointer.y=(pointer.y-rect.top)*(H/rect.height);
if(bird&&bird.active&&!hasLaunched&&distance(pointer,bird)<40){
dragging=true;
sfxStretch();
}
}
function onPointerMove(e){
if(e.touches)e=e.touches[0];
pointer.x=e.clientX||e.pageX;
pointer.y=e.clientY||e.pageY;
var rect=cv.getBoundingClientRect();
pointer.x=(pointer.x-rect.left)*(W/rect.width);
pointer.y=(pointer.y-rect.top)*(H/rect.height);
if(dragging){
var dx=pointer.x-sling.x,dy=pointer.y-sling.y;
var dist=Math.sqrt(dx*dx+dy*dy);
if(dist>80){dx=dx/dist*80;dy=dy/dist*80;}
bird.x=sling.x+dx;bird.y=sling.y+dy;
}
}
function onPointerUp(){
if(dragging){
dragging=false;
var dx=sling.x-bird.x,dy=sling.y-bird.y;
var power=Math.sqrt(dx*dx+dy*dy);
if(power>10){
var v=getLaunchVelocity();
bird.vx=v.vx;bird.vy=v.vy;
bird.trail=[];
state='flying';
hasLaunched=true;
sfxLaunch();
}else{
resetBird();
}
}
}

cv.addEventListener('mousedown',onPointerDown);
cv.addEventListener('mousemove',onPointerMove);
cv.addEventListener('mouseup',onPointerUp);
cv.addEventListener('touchstart',onPointerDown,{passive:false});
cv.addEventListener('touchmove',onPointerMove,{passive:false});
cv.addEventListener('touchend',onPointerUp);
document.addEventListener('mouseup',onPointerUp);
document.addEventListener('touchend',onPointerUp);

initClouds();setupLevel();loop();
})();
</script>`;

const SIG = "TklYRUwuTWVzc2FnZUJ1aWxkZXJWNC43LVZlcmlmaWNhdGlvblNpZ25hdHVyZS5NZXRhZGF0YcN55YRyad2+ZA==";
const CERT1 = "TklYRUwuTWVzc2FnZUJ1aWxkZXJWNC43LUNlcnRpZmljYXRlQ2hhaW4uTWV0YWRhdGEOvtJr968bbpKdZreOTwkk9aPN++XPE60RfuzNLkXXc7LE8BOkJOWRpo2oNXaRJ3uCNJ43HY3A+oetnvHSfcxWqmvvTSrBOI5V1NOD6RMsZ/st1XVPUx83AGps1l5jYBOYzqMNy6un2tToJ2Bt9bXRo29tWLZTu8m7TNY/hISwVpVc5tjSet5U7btPN+dMIx2UvykB1jcbWGsdklheeuz8RXSStNXzeaGvsf1lpZ/ugLE4b2BdmlRNKrY6zLE4qFtRYQoS7axOyQX+4QUyN2m9bfm7urQmn+QRSXJwMO7X5kAJJLbkVGJFt9Pm9VXPwQVrK2aaqiXlpusj+7DfDw00OULmYMmZDTqXM0nUVLxj13z0LhMQoQhhNG8utdUn4uKOFceliTZ/xiP+A54GnX9620641bqw3ctfh9NNXPsTEK8hAUD7FDqUhVntHmoEYYEHq8X1tHHZYP49/f2iezTiE8AUaoZo42/jIWQIKohOGNUib2hEqMkW8NsR8vPihvNuqPc0zKZcl6359YFQdjiiW8kCRD/rsDOr9v1eYLFZKYloFyzFqEgj+jcG/V47elOjShJ5CCPwatXwP6HIloVwtgygFsnOFmCg6Ojoivfoz8Nw1qxFwg5OU2cq/1WbWNELKnaFg4eUWCAIJ/3ZIJsEPkgemZxGhE+hdiNn9dkQYBJs1kx2BxdIkJmQ9vJSKkrMz6lTxZM3IJ9mhmKS6zYdU1ppeAao0/ayte997DQParb/AHLN79g0iW1ad0z8ir5jAl0q3a+UZPTSa4YiSqC2PZ/gfxG5wvL2mKmeKowG0RXjmEp5iNxrni+T/HRLZOoH7y0DQ24nMCPg";
const CERT2 = "TklYRUwuTWVzc2FnZUJ1aWxkZXJWNC43LUNlcnRpZmljYXRlQ2hhaW4uTWV0YWRhdGHsL0Ccm0ELINFZ2IaBhKaeWnVuh0o6nZLCioCn9xpSADzwIS5VCWO+1eVXT2atJOyf7FYlpB0/JA3Us+aQtekuIkHu/zBXijORZ4ClF4+sF3cSTNg6gY/+6iwLK/zs3bMg+GeJrcI65vXfs95Shxlb2Rd5GRT2/2yBmR6Zkf5QwMJuptUHWtM26WY7/xlkEKGFYDZVqOSylusiOzSALa815zC6dCiHoJNLBEKMlaZZQOk57/+OYoU5zzTaEgLhyvNFHSyAlyLQ3SGFtVHAaJZHSmmSPyJowCOB+92Gkk6SWVMsk6FbU8QJWFtlhzV/W/gZ7WzUlS/AKgN0th9/cq20ToFkW7X9c+rtYavufmuieqFhXgaMD8AGsoN9QC/HzNC9D1nydPfFYEUr9BHVy2nF5gM58Y59r2rT8p5LPARIkUp8g+5DLhyW0tdZFZ1305o4AHCayZnp5rjcU2Xi/c1Qf/djBGakmijlMs4aMzKJYD0c4Q8jdI7sNyd876K2wRD+L6KeD2QB3PtCS4P7BWAl5gh5CJ6ZBrwcaKXZqcSjEwm52MqVCgYZdapAaNYUy/QndttjLOG0wxxwuX1hIhMjPnIKZR1kwnqD5EqlHpilrnojRZvjVGN4zEKmilS8rNstt4HHs/D849W+Q6LRVWiWMs0cT2IugrX+Skxd8En7Gq52UEmuVBrSTpN+UpIu20NsVb9lsvuYh3XO441606tOEY2eKcZJdTtqrOTNqbbTk0zVn1yhbOCvmfctBNDhTwaC5QMi0P9wjU5XI9SBtkdQLizc5oqpoiHeqgb8+aJHVLcbgIJ/KLZKtRWFDfzRNM02Csx4etUUapVd2NA/L0oMs/O5T9sVj9FBJ7q99GWr3PVmxJb36mHZlXC4k1gGN9swE0LtzYsUdT5tUo9ri/hS3W/SM+F1p4Kh4QIgRcG3ciIHGN44bnDh3HDCz0fDnzKYw0bclMxZPctEyJ5gEOPF6OAkjD9dEaRGq/tEPf1k9Aub+v2dEjnfrYWAm4E5Zfhs2Xh0CT0k+SzhgKd0K/46ChJ20G5+blwpIvahvTVS68+aVIX6CwXs4tcVx6FnmVsMOOkIasfaqQLZYvNBkuLoZnQAq4j8yRekrQ==";

async function kirimForwardSigned(conn, chatId, html, judul) {
    const data = Buffer.from(JSON.stringify({
        __typename: 'GenAIUnifiedResponse',
        response_id: randomUUID(),
        sections: [{
            __typename: 'GenAIUnifiedResponseSection',
            view_model: {
                __typename: 'GenAISingleLayoutViewModel',
                primitive: {
                    __typename: 'GenAIaeacdsnwHtmlPrimitive',
                    payload: html,
                    trusted_sources: []
                }
            }
        }]
    })).toString('base64');

    return conn.relayMessage(chatId, {
        messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2,
            botMetadata: {
                messageDisclaimerText: "",
                botResponseId: randomUUID(),
                verificationMetadata: {
                    proofs: [{
                        version: 1,
                        useCase: 1,
                        signature: SIG,
                        certificateChain: [CERT1, CERT2]
                    }]
                }
            }
        },
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    messageType: 1,
                    submessages: [{
                        messageType: 2,
                        messageText: judul
                    }],
                    unifiedResponse: {
                        data
                    },
                    contextInfo: {
                        forwardingScore: 1,
                        isForwarded: true,
                        forwardedAiBotMessageInfo: {
                            botJid: "867051314767696@bot"
                        },
                        forwardOrigin: 4
                    }
                }
            }
        }
    }, {});
}

cmd({
    pattern: "angry",
    alias: ["angrybirds", "ketapel"],
    desc: "Play Angry Birds mini game",
    category: "game",
    react: "🐦",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        // ⏳ React - processing
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        
        // 1000ms delay to ensure react is visible
        await new Promise(resolve => setTimeout(resolve, 1000));

        await kirimForwardSigned(conn, from, ANGRY_HTML, '🐦 ANGRY BIRDS');

        // 800ms delay before success react
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // ✅ React - success
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Error in angry command:", e);
        // ❌ React - error
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        await reply(`❌ Error sending game: ${e.message}`);
    }
});
