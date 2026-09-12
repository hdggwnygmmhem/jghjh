import { fileURLToPath } from 'url';
import { cmd } from '../command.js';

const __filename = fileURLToPath(import.meta.url);

const htmlPayload = `<style>
* { -webkit-tap-highlight-color: transparent; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; box-sizing: border-box; }
body { margin: 0; background: transparent; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #eee; touch-action: manipulation; cursor: pointer; }
.cr-wrap { width: 100%; max-width: 640px; margin: auto; padding: 12px; }
.cr-card { background: rgba(10, 14, 24, 0.9); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 0, 127, 0.3); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(255, 0, 127, 0.15), 0 0 15px rgba(0, 243, 255, 0.2); }
.cr-header { padding: 14px 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); display: flex; justify-content: space-between; align-items: center; background: linear-gradient(90deg, rgba(255,0,127,0.05), rgba(0,243,255,0.05)); }
.cr-sub { font-size: 10px; letter-spacing: 2px; color: #ff007f; font-weight: 700; text-transform: uppercase; display: flex; align-items: center; gap: 4px; }
.cr-title { font-size: 20px; font-weight: 900; color: #fff; text-shadow: 0 0 10px rgba(255, 0, 127, 0.6); letter-spacing: 1px; }
.cr-stats { text-align: right; display: flex; align-items: center; gap: 14px; }
.cr-score { font-size: 20px; font-weight: 900; color: #ff007f; text-shadow: 0 0 12px rgba(255, 0, 127, 0.8); }
.cr-best { font-size: 10px; color: rgba(255, 255, 255, 0.5); font-weight: 600; margin-top: 1px; display: flex; align-items: center; justify-content: flex-end; gap: 3px; }
.cr-audio-btn { background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; padding: 0; }
.cr-audio-btn:active { transform: scale(0.9); }
.cr-body { padding: 14px; position: relative; }
canvas#game { width: 100%; height: auto; background: #05070c; border: 1px solid rgba(255, 0, 127, 0.2); border-radius: 12px; display: block; box-shadow: inset 0 0 20px rgba(0,0,0,0.8); }
.cr-status { display: flex; justify-content: space-between; margin-top: 8px; font-size: 11px; color: rgba(255, 255, 255, 0.6); font-weight: 600; }
.svg-icon { display: inline-block; vertical-align: middle; }
</style>

<div class="cr-wrap">
  <div class="cr-card">
    <div class="cr-header">
      <div>
        <div class="cr-sub">
          <svg class="svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff007f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          KAMRAN-MD ARCADE
        </div>
        <div class="cr-title">Cyber Runner</div>
      </div>
      <div class="cr-stats">
        <button id="soundToggle" class="cr-audio-btn" title="Toggle Sound">
          <svg id="iconAudioOn" class="svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff007f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          <svg id="iconAudioOff" class="svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
        </button>
        <div>
          <div id="score" class="cr-score">0000</div>
          <div id="best" class="cr-best">
            <svg class="svg-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"></path></svg>
            <span id="bestText">BEST 0000</span>
          </div>
        </div>
      </div>
    </div>
    <div class="cr-body">
      <canvas id="game" width="640" height="360"></canvas>
      <div class="cr-status">
        <span id="gameStatus">Tap to Jump</span>
        <span id="speedStatus">Speed 5.0x</span>
      </div>
      <div style="font-size: 10px; color: rgba(255, 0, 127, 0.5); text-align: center; margin-top: 6px; font-weight: 600; letter-spacing: 1px;">WM: KAMRAN-MD</div>
    </div>
  </div>
</div>

<script>
(function() {
  const c = document.getElementById('game');
  const ctx = c.getContext('2d');
  const scoreEl = document.getElementById('score');
  const bestTextEl = document.getElementById('bestText');
  const gameStatus = document.getElementById('gameStatus');
  const speedStatus = document.getElementById('speedStatus');
  const soundBtn = document.getElementById('soundToggle');
  const iconAudioOn = document.getElementById('iconAudioOn');
  const iconAudioOff = document.getElementById('iconAudioOff');

  const GY = 300;
  const P_SIZE = 30;

  let audioCtx = null;
  let soundMuted = false;

  function initAudio() {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioCtx = new AudioCtx();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }

  soundBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    soundMuted = !soundMuted;
    iconAudioOn.style.display = soundMuted ? 'none' : 'inline-block';
    iconAudioOff.style.display = soundMuted ? 'inline-block' : 'none';
  });

  function playSound(type) {
    if (soundMuted) return;
    initAudio();
    if (!audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      if (type === 'jump') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 0.1);
      } else if (type === 'crash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 0.2);
      }
    } catch(e) {}
  }

  let bestScore = 0;
  try { bestScore = parseInt(localStorage.getItem('cr_best') || 0, 10); } catch(e) {}

  const STATE_PLAYING = 1;
  const STATE_GAMEOVER = 2;

  let gameState = STATE_PLAYING;
  let player, obstacles, particles, bgGrid;
  let score, speed, spawnTimer, lastTime, shake;

  function resetGame() {
    player = { x: 80, y: GY - P_SIZE, w: P_SIZE, h: P_SIZE, vy: 0, isGrounded: true };
    obstacles = [];
    particles = [];
    bgGrid = [];
    for(let i=0; i<15; i++) {
      bgGrid.push({ x: i * 50, y: Math.random() * GY, speed: Math.random() * 0.5 + 0.2 });
    }
    score = 0;
    speed = 5.0;
    spawnTimer = 40;
    lastTime = 0;
    shake = 0;
    scoreEl.textContent = '0000';
    bestTextEl.textContent = 'BEST ' + String(Math.floor(bestScore)).padStart(4, '0');
  }

  function triggerJump() {
    initAudio();
    if (gameState === STATE_GAMEOVER) {
      resetGame();
      gameState = STATE_PLAYING;
      return;
    }
    if (player.isGrounded) {
      player.vy = -12.5;
      player.isGrounded = false;
      playSound('jump');
    }
  }

  function update(dt) {
    if (gameState === STATE_PLAYING) {
      player.vy += 0.75 * dt;
      player.y += player.vy * dt;

      if (player.y >= GY - P_SIZE) {
        player.y = GY - P_SIZE;
        player.vy = 0;
        player.isGrounded = true;
      }

      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        let h = Math.random() * 30 + 25;
        obstacles.push({ x: c.width + 20, y: GY - h, w: 24, h: h });
        spawnTimer = Math.max(35, 75 - speed * 3) + Math.random() * 25;
      }

      obstacles.forEach(o => o.x -= speed * dt);
      obstacles = obstacles.filter(o => o.x > -50);

      bgGrid.forEach(g => {
        g.x -= g.speed * speed * 0.3 * dt;
        if (g.x < 0) g.x = c.width;
      });

      speed = Math.min(10.0, speed + 0.001 * dt);
      score += dt * 0.5;
      scoreEl.textContent = String(Math.floor(score)).padStart(4, '0');
      speedStatus.textContent = 'Speed ' + speed.toFixed(1) + 'x';

      if (score > bestScore) {
        bestScore = score;
        try { localStorage.setItem('cr_best', Math.floor(bestScore)); } catch(e) {}
        bestTextEl.textContent = 'BEST ' + String(Math.floor(bestScore)).padStart(4, '0');
      }

      for (let o of obstacles) {
        if (player.x < o.x + o.w && player.x + player.w > o.x && player.y < o.y + o.h && player.y + player.h > o.y) {
          gameState = STATE_GAMEOVER;
          shake = 12;
          playSound('crash');
          break;
        }
      }
    }
    if (shake > 0) shake = Math.max(0, shake - 0.5 * dt);
  }

  function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, c.width, c.height);

    ctx.strokeStyle = 'rgba(0, 243, 255, 0.1)';
    ctx.lineWidth = 1;
    bgGrid.forEach(g => {
      ctx.strokeRect(g.x, g.y, 20, 20);
    });

    ctx.strokeStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GY);
    ctx.lineTo(c.width, GY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#00f3ff';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 12;
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 10;
    obstacles.forEach(o => {
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });
    ctx.shadowBlur = 0;

    if (gameState === STATE_GAMEOVER) {
      ctx.fillStyle = 'rgba(5, 7, 12, 0.8)';
      ctx.fillRect(0, 0, c.width, c.height);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff007f';
      ctx.font = '900 28px "Segoe UI", sans-serif';
      ctx.fillText('GAME OVER', c.width / 2, c.height / 2 - 15);

      ctx.fillStyle = '#fff';
      ctx.font = '600 14px "Segoe UI", sans-serif';
      ctx.fillText('Tap to Restart', c.width / 2, c.height / 2 + 20);
    }

    ctx.restore();
  }

  function loop(time) {
    if (!lastTime) lastTime = time;
    let dt = Math.min((time - lastTime) / 16.67, 2.0);
    lastTime = time;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  c.addEventListener('touchstart', (e) => { e.preventDefault(); triggerJump(); }, { passive: false });
  c.addEventListener('mousedown', triggerJump);
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      triggerJump();
    }
  });

  resetGame();
  requestAnimationFrame(loop);
})();
</script>`;

cmd({
    pattern: "cyberrunner",
    alias: ["runner", "crgame"],
    desc: "Main game Cyber Runner interaktif via KAMRAN-MD Rich Message",
    category: "game",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, {
            text: htmlPayload
        }, { quoted: mek });
    } catch (e) {
        console.error('[CYBER RUNNER ERROR]', e?.message || e);
        return await reply('❌ Gagal mengirim game: ' + (e?.message || e));
    }
});
