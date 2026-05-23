/**
 * Chemistry Ph.D. Portfolio - Vector Pointing Flow Field Particle System
 * Implements a high-performance interactive physics-based particle system.
 * Simulates chemical force fields, molecular networks, and fluid dynamics.
 */

class Particle {
  constructor(canvas) {
    this.canvas = canvas;
    this.reset(true);
  }

  reset(initRandom = false) {
    const dpr = window.devicePixelRatio || 1;
    const width = this.canvas.width / dpr;
    const height = this.canvas.height / dpr;

    this.x = Math.random() * width;
    
    // If resetting after going offscreen, start at edges
    if (!initRandom) {
      const edge = Math.floor(Math.random() * 4);
      if (edge === 0) this.x = 0; // Left
      else if (edge === 1) this.x = width; // Right
      else if (edge === 2) this.y = 0; // Top
      else this.y = height; // Bottom
    }

    if (initRandom || this.y === undefined) {
      this.y = Math.random() * height;
    }

    this.vx = 0;
    this.vy = 0;
    this.radius = Math.random() * 1.3 + 0.6; // elegant thin points
    this.speedFactor = Math.random() * 0.35 + 0.15; // varying weights
    this.life = Math.random() * 180 + 80;
    this.maxLife = this.life;
    this.opacity = 0;
  }

  update(mouse, time) {
    const scale1 = 0.0015;
    const scale2 = 0.0035;
    
    // 1. Vector Flow Field Angle (aligned with the vector grid)
    const angle1 = Math.sin(this.x * scale1 + time * 0.04) * Math.cos(this.y * scale1 - time * 0.05) * Math.PI * 2;
    const angle2 = Math.cos(this.x * scale2 - time * 0.02) * Math.sin(this.y * scale2 + time * 0.03) * Math.PI * 1.5;
    let flowAngle = angle1 + angle2 * 0.4;

    // 2. Electrostatic / Magnetic Mouse Interaction
    if (mouse.active && mouse.x !== null && mouse.y !== null) {
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < mouse.radius) {
        const force = (mouse.radius - dist) / mouse.radius; // 0 (outer edge) to 1 (center)
        
        // Repulsion Angle
        const repAngle = Math.atan2(dy, dx);
        // Vortex/Swirl Angle (perpendicular spiral)
        const swirlAngle = repAngle + Math.PI / 2;

        // Blend the flow field angle with the mouse swirl
        const mix = force * 0.85;
        flowAngle = (1 - mix) * flowAngle + mix * swirlAngle;
        
        // Additional push away force
        const pushForce = force * 0.25;
        this.vx += Math.cos(repAngle) * pushForce;
        this.vy += Math.sin(repAngle) * pushForce;
      }
    }

    // Apply Flow Field Force
    const flowForce = 0.12 * this.speedFactor;
    this.vx += Math.cos(flowAngle) * flowForce;
    this.vy += Math.sin(flowAngle) * flowForce;

    // Apply drag/friction to cap velocity naturally
    this.vx *= 0.94;
    this.vy *= 0.94;

    // Move particle
    this.x += this.vx;
    this.y += this.vy;

    // Fade in/out depending on life stage
    this.life--;
    if (this.life < 30) {
      this.opacity = this.life / 30; // Fade out
    } else if (this.maxLife - this.life < 30) {
      this.opacity = (this.maxLife - this.life) / 30; // Fade in
    } else {
      this.opacity = 1;
    }

    const dpr = window.devicePixelRatio || 1;
    const width = this.canvas.width / dpr;
    const height = this.canvas.height / dpr;

    // Bounds checking
    if (
      this.x < -20 ||
      this.x > width + 20 ||
      this.y < -20 ||
      this.y > height + 20 ||
      this.life <= 0
    ) {
      this.reset(false);
    }
  }

  draw(ctx, particleColor) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = particleColor.replace('OPACITY', (this.opacity * 0.65).toFixed(3));
    ctx.fill();
  }
}

class FlowFieldEffect {
  constructor() {
    this.canvas = document.getElementById('flowfield-canvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.particleCount = 110; // high particle density
    this.time = 0;

    // Mouse settings
    this.mouse = {
      x: null,
      y: null,
      active: false,
      radius: 180 // wider radius of influence
    };

    // Flow field has dynamic colors matching light (midnight slate) and dark (ice silver) themes
    this.colors = {
      light: 'rgba(15, 23, 42, OPACITY)', 
      dark: 'rgba(224, 242, 254, OPACITY)', 
      lightConnection: 'rgba(15, 23, 42, OPACITY)',
      darkConnection: 'rgba(224, 242, 254, OPACITY)'
    };

    this.currentTheme = document.documentElement.getAttribute('data-theme') || 'light';

    this.init();
  }

  init() {
    this.resizeCanvas();
    this.createParticles();
    this.setupListeners();
    this.animate();
  }

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.scale(dpr, dpr);

    // Adjust particle count dynamically for extreme density
    const screenArea = window.innerWidth * window.innerHeight;
    this.particleCount = Math.min(180, Math.floor(screenArea / 5000));
    
    while (this.particles.length < this.particleCount) {
      this.particles.push(new Particle(this.canvas));
    }
    if (this.particles.length > this.particleCount) {
      this.particles.length = this.particleCount;
    }
  }

  createParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push(new Particle(this.canvas));
    }
  }

  setupListeners() {
    window.addEventListener('resize', () => this.resizeCanvas());

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.active = true;
    });

    window.addEventListener('mouseenter', () => {
      this.mouse.active = true;
    });

    window.addEventListener('mouseleave', () => {
      this.mouse.active = false;
      this.mouse.x = null;
      this.mouse.y = null;
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this.mouse.x = e.touches[0].clientX;
        this.mouse.y = e.touches[0].clientY;
        this.mouse.active = true;
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.mouse.active = false;
      this.mouse.x = null;
      this.mouse.y = null;
    });

    document.addEventListener('themeChanged', (e) => {
      this.currentTheme = e.detail.theme;
    });
  }

  drawVectorField() {
    const spacing = 26; // extremely dense spacing for rich vector grid
    const dpr = window.devicePixelRatio || 1;
    const width = this.canvas.width / dpr;
    const height = this.canvas.height / dpr;

    this.ctx.lineWidth = 0.7;
    
    // Theme-specific base vector colors
    const baseColor = this.currentTheme === 'dark' 
      ? 'rgba(224, 242, 254, OPACITY)' 
      : 'rgba(15, 23, 42, OPACITY)';

    const scale1 = 0.0015;
    const scale2 = 0.0035;

    for (let x = spacing / 2; x < width; x += spacing) {
      for (let y = spacing / 2; y < height; y += spacing) {
        // Aligned flow equations
        const angle1 = Math.sin(x * scale1 + this.time * 0.04) * Math.cos(y * scale1 - this.time * 0.05) * Math.PI * 2;
        const angle2 = Math.cos(x * scale2 - this.time * 0.02) * Math.sin(y * scale2 + this.time * 0.03) * Math.PI * 1.5;
        let angle = angle1 + angle2 * 0.4;

        let alphaFactor = 1.0;

        // Apply mouse interaction
        if (this.mouse.active && this.mouse.x !== null && this.mouse.y !== null) {
          const dx = x - this.mouse.x;
          const dy = y - this.mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < this.mouse.radius) {
            const force = (this.mouse.radius - dist) / this.mouse.radius;
            const repAngle = Math.atan2(dy, dx);
            const swirlAngle = repAngle + Math.PI / 2;
            
            // Mix flow field with mouse force
            const mix = force * 0.85;
            angle = (1 - mix) * angle + mix * swirlAngle;
            
            // Brighten line slightly near mouse for interactive touch
            alphaFactor = 1.0 + force * 1.6;
          }
        }

        // Draw the vector dash
        const len = 6.5; // slightly shorter dashes for extremely dense look
        const startX = x - Math.cos(angle) * (len / 2);
        const startY = y - Math.sin(angle) * (len / 2);
        const endX = x + Math.cos(angle) * (len / 2);
        const endY = y + Math.sin(angle) * (len / 2);

        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        
        // Dynamic opacity based on theme and mouse proximity
        const lineOpacity = this.currentTheme === 'dark' ? 0.048 : 0.04;
        this.ctx.strokeStyle = baseColor.replace('OPACITY', (lineOpacity * alphaFactor).toFixed(3));
        this.ctx.stroke();

        // Draw a tiny pointer head / point at the tip to represent vectors
        this.ctx.beginPath();
        this.ctx.arc(endX, endY, 0.65, 0, Math.PI * 2);
        const dotOpacity = this.currentTheme === 'dark' ? 0.082 : 0.068;
        this.ctx.fillStyle = baseColor.replace('OPACITY', (dotOpacity * alphaFactor).toFixed(3));
        this.ctx.fill();
      }
    }
  }

  drawConnections() {
    const maxDistance = 80; // extremely dense links for chemical molecular mesh
    const length = this.particles.length;

    const connectionColor = this.currentTheme === 'dark' ? this.colors.darkConnection : this.colors.lightConnection;

    this.ctx.lineWidth = 0.5;

    for (let i = 0; i < length; i++) {
      const p1 = this.particles[i];
      for (let j = i + 1; j < length; j++) {
        const p2 = this.particles[j];
        
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDistance) {
          const opacity = (1 - (dist / maxDistance)) * 0.16 * Math.min(p1.opacity, p2.opacity);
          
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.strokeStyle = connectionColor.replace('OPACITY', opacity.toFixed(3));
          this.ctx.stroke();
        }
      }
    }
  }

  animate() {
    this.time += 0.04;
    
    // Retrieve current theme
    this.currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const particleColor = this.currentTheme === 'dark' 
      ? this.colors.dark 
      : this.colors.light;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Draw the stationary vector field first in the background
    this.drawVectorField();

    // 2. Draw connections between particles
    this.drawConnections();

    // 3. Update and draw particles
    const len = this.particles.length;
    for (let i = 0; i < len; i++) {
      this.particles[i].update(this.mouse, this.time);
      this.particles[i].draw(this.ctx, particleColor);
    }

    requestAnimationFrame(() => this.animate());
  }
}

// Theme Toggle Manager
function initThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;

  const sunIcon = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>
  `;

  const moonIcon = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
  `;

  // Get current active theme
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  
  // Set initial icon
  toggleBtn.innerHTML = currentTheme === 'dark' ? sunIcon : moonIcon;

  toggleBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = current === 'light' ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    toggleBtn.innerHTML = newTheme === 'dark' ? sunIcon : moonIcon;

    // Notify listeners (like the vector canvas)
    document.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme: newTheme }
    }));
  });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  new FlowFieldEffect();
});

