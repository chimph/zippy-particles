let canvas, ctx, audioContext, analyser, microphone, sensitivitySlider;
let particles = [];
const particleCount = 1000;

function init() {
  canvas = document.getElementById('visualizer');
  ctx = canvas.getContext('2d');
  sensitivitySlider = document.getElementById('sensitivity');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  document.getElementById('startButton').addEventListener('click', startVisualizer);
  window.addEventListener('resize', onResize);
  canvas.addEventListener('mousemove', onMouseMove);

  animate();
}

function startVisualizer() {
  if (audioContext) {
    return;
  }

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;

  navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then(stream => {
      microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      console.log('Microphone connected successfully');
    })
    .catch(err => {
      console.error('Microphone access denied:', err);
      alert('Please grant microphone access to use the audio visualizer.');
    });
}

function onResize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function onMouseMove(e) {
  const mouseX = e.clientX;
  const mouseY = e.clientY;

  particles.forEach(particle => {
    const dx = mouseX - particle.x;
    const dy = mouseY - particle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 100) {
      particle.vx += dx / distance * 0.5;
      particle.vy += dy / distance * 0.5;
    }
  });
}

class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 5 + 1;
    this.baseSize = this.size;
    this.vx = Math.random() * 2 - 1;
    this.vy = Math.random() * 2 - 1;
    this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
  }

  update(audioData) {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
    if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

    const sensitivity = sensitivitySlider.value / 50;
    
    if (audioData) {
      const audioIndex = Math.floor(this.x / canvas.width * audioData.length);
      const audioValue = audioData[audioIndex] / 128.0;
      this.size = this.baseSize + audioValue * 10 * sensitivity;
      this.color = `hsl(${audioValue * 360}, 100%, 50%)`;
    } else {
      this.size = this.baseSize;
      this.color = `hsl(${(this.x / canvas.width) * 360}, 100%, 50%)`;
    }

    this.vx *= 0.99;
    this.vy *= 0.99;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

function animate() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let audioData;
  if (analyser) {
    audioData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(audioData);
  }

  particles.forEach(particle => {
    particle.update(audioData);
    particle.draw();
  });

  requestAnimationFrame(animate);
}

init();
