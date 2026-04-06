document.addEventListener('DOMContentLoaded', () => {

/* 
    utility: Random float between min & max
*/
  const rand = (min, max) => Math.random() * (max - min) + min;

  /* 
    falling pertals in intro + hero sections
  */
  const bgPetals = document.getElementById('bgPetals');
  const petalColors = ['#F4B8B8','#F2C9B0','#D6C4E0','#F9D5D3','#EDD8EA'];

  function createPetal(container, delayed = false) {
    const p = document.createElement('div');
    p.className = 'petal';
    p.style.left         = rand(0, 100) + 'vw';
    p.style.top          = delayed ? rand(-20, 100) + 'vh' : '-20px';
    p.style.background   = petalColors[Math.floor(rand(0, petalColors.length))];
    p.style.width        = rand(8, 16) + 'px';
    p.style.height       = rand(11, 20) + 'px';
    p.style.animationDuration = rand(6, 14) + 's';
    p.style.animationDelay    = rand(0, delayed ? 0 : 3) + 's';
    p.style.opacity = 0;
    container.appendChild(p);
    // Remove after animation to avoid DOM bloat
    const dur = parseFloat(p.style.animationDuration) * 1000
              + parseFloat(p.style.animationDelay) * 1000 + 500;
    setTimeout(() => {
      p.remove();
      createPetal(container, false);
    }, dur);
  }

  // Spawn 18 initial petals (some already mid-fall)
  for (let i = 0; i < 18; i++) createPetal(bgPetals, true);

  /* music plus tranastion */
  const musicBtn  = document.getElementById('musicBtn');
  const bgMusic   = document.getElementById('bgMusic');
  const introSec  = document.getElementById('intro');
  const mainSite  = document.getElementById('mainSite');

  musicBtn.addEventListener('click', () => {
    // Try to play music (may silently fail without a real file — that's OK)
    bgMusic.volume = 0;
    bgMusic.play().catch(() => {});
    fadeInAudio(bgMusic, 0.5, 2000);

    // Animate intro out, reveal main site
    introSec.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    introSec.style.opacity    = '0';
    introSec.style.transform  = 'scale(1.04)';

    setTimeout(() => {
      introSec.style.display = 'none';
      mainSite.classList.remove('hidden');
      // Kick off hero petal rain
      spawnHeroPetals();
      // Scroll to top
      window.scrollTo({ top: 0 });
    }, 800);
  });

  function fadeInAudio(audio, targetVol, duration) {
    const steps    = 30;
    const interval = duration / steps;
    const step     = targetVol / steps;
    let   current  = 0;
    const timer    = setInterval(() => {
      current = Math.min(current + step, targetVol);
      audio.volume = current;
      if (current >= targetVol) clearInterval(timer);
    }, interval);
  }

  // hero 3D tilt effect

  const hero19Wrap = document.getElementById('hero19Wrap');
  const tiltHint   = document.getElementById('tiltHint');
  let   gyroAvail  = false;

  // Gyroscope (mobile)
  function handleOrientation(e) {
    if (!gyroAvail) {
      gyroAvail = true;
      tiltHint.style.display = 'block';
    }
    // gamma = left/right tilt (-90 to 90), beta = front/back (-180 to 180)
    const x = Math.max(-25, Math.min(25, (e.gamma || 0)));
    const y = Math.max(-20, Math.min(20, ((e.beta  || 0) - 30)));
    hero19Wrap.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
  }

  // mouse fallback (desktop)
  function handleMouseMove(e) {
    if (gyroAvail) return;
    const heroRect = document.getElementById('hero').getBoundingClientRect();
    const cx = heroRect.left + heroRect.width  / 2;
    const cy = heroRect.top  + heroRect.height / 2;
    const dx = (e.clientX - cx) / (heroRect.width  / 2);
    const dy = (e.clientY - cy) / (heroRect.height / 2);
    const rotY = dx * 18;
    const rotX = dy * -12;
    hero19Wrap.style.transform = `rotateY(${rotY}deg) rotateX(${rotX}deg)`;
    tiltHint.style.display = 'none';
  }

  // Request permission on iOS 13+
  if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    // Show a small prompt when user first scrolls to hero
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          DeviceOrientationEvent.requestPermission()
            .then(res => { if (res === 'granted') window.addEventListener('deviceorientation', handleOrientation); })
            .catch(() => {});
          observer.disconnect();
        }
      });
    }, { threshold: 0.5 });
    observer.observe(document.getElementById('hero'));
  } else {
    window.addEventListener('deviceorientation', handleOrientation);
  }

  document.addEventListener('mousemove', handleMouseMove);

  // Hero decorative petals
  const heroPetals = document.getElementById('heroPetals');
  function spawnHeroPetals() {
    for (let i = 0; i < 12; i++) createPetal(heroPetals, true);
  }

/* gallery section */
  const lightbox        = document.getElementById('lightbox');
  const lightboxImg     = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose   = document.getElementById('lightboxClose');
  const LONG_PRESS_MS   = 450;

  let pressTimer = null;

  function openLightbox(imgSrc, caption) {
    lightboxImg.src     = imgSrc;
    lightboxCaption.textContent = caption;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    lightboxImg.src = '';
  }

  document.querySelectorAll('.masonry__item').forEach(item => {
    const img     = item.querySelector('img');
    const caption = item.dataset.caption || '';

    // Touch
    item.addEventListener('touchstart', (e) => {
      item.classList.add('pressing');
      pressTimer = setTimeout(() => openLightbox(img.src, caption), LONG_PRESS_MS);
    }, { passive: true });

    item.addEventListener('touchend',   () => { clearTimeout(pressTimer); item.classList.remove('pressing'); });
    item.addEventListener('touchcancel',() => { clearTimeout(pressTimer); item.classList.remove('pressing'); });

    // Mouse (desktop)
    item.addEventListener('mousedown',  () => {
      item.classList.add('pressing');
      pressTimer = setTimeout(() => openLightbox(img.src, caption), LONG_PRESS_MS);
    });
    item.addEventListener('mouseup',    () => { clearTimeout(pressTimer); item.classList.remove('pressing'); });
    item.addEventListener('mouseleave', () => { clearTimeout(pressTimer); item.classList.remove('pressing'); });
    // Prevent context menu on long-press
    item.addEventListener('contextmenu', e => e.preventDefault());
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

  /* letters */
  const lettersStack = document.getElementById('lettersStack');
  const cards        = Array.from(lettersStack.querySelectorAll('.letter-card'));
  const prevBtn      = document.getElementById('letterPrev');
  const nextBtn      = document.getElementById('letterNext');
  const dotsWrap     = document.getElementById('letterDots');

  let currentCard = 0;

  // Build dots
  cards.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'letter-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => goToCard(i));
    dotsWrap.appendChild(dot);
  });

  function goToCard(index) {
    const dir     = index > currentCard ? 1 : -1;
    const oldCard = cards[currentCard];
    const newCard = cards[index];

    // Slide old card out
    oldCard.classList.remove('active');
    oldCard.classList.add(dir === 1 ? 'exit-left' : 'exit-right');
    setTimeout(() => oldCard.classList.remove(dir === 1 ? 'exit-left' : 'exit-right'), 450);

    // Snap new card to off-screen start position with NO transition
    newCard.style.transition = 'none';
    newCard.style.opacity    = '0';
    newCard.style.transform  = dir === 1 ? 'translateX(60px) scale(0.96)' : 'translateX(-60px) scale(0.96)';

    // Force the browser to paint that starting position before animating
    newCard.offsetHeight;

    // Re-enable transitions and animate to center
    newCard.style.transition = '';
    newCard.style.opacity    = '';
    newCard.style.transform  = '';
    newCard.classList.add('active');

    currentCard = index;

    // Update dots
    dotsWrap.querySelectorAll('.letter-dot').forEach((d, i) => {
      d.classList.toggle('active', i === currentCard);
    });

    // Update buttons
    prevBtn.disabled = currentCard === 0;
    nextBtn.disabled = currentCard === cards.length - 1;
  }
  prevBtn.addEventListener('click', () => { if (currentCard > 0) goToCard(currentCard - 1); });
  nextBtn.addEventListener('click', () => { if (currentCard < cards.length - 1) goToCard(currentCard + 1); });

  // Set initial disabled state
  prevBtn.disabled = true;

  // Swipe gesture on letters stack
  let touchStartX = 0;
  lettersStack.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  lettersStack.addEventListener('touchend', e => {
    const dx = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 40) {
      if (dx > 0 && currentCard < cards.length - 1) goToCard(currentCard + 1);
      if (dx < 0 && currentCard > 0)                goToCard(currentCard - 1);
    }
  });

  /* ═══════════════════════════════════════
     SECTION 5 · CONFETTI
  ═══════════════════════════════════════ */
  const confettiBtn    = document.getElementById('confettiBtn');
  const confettiCanvas = document.getElementById('confettiCanvas');
  const ctx            = confettiCanvas.getContext('2d');

  let confettiParticles = [];
  let confettiRunning   = false;

  const confettiColors = [
    '#F4B8B8','#F2C9B0','#D6C4E0','#F9D5D3',
    '#EDD8EA','#D4AF7A','#FDE8E0','#E8A0A0'
  ];

  function resizeCanvas() {
    confettiCanvas.width  = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  class Particle {
    constructor() { this.reset(true); }
    reset(fromTop = false) {
      this.x     = rand(0, confettiCanvas.width);
      this.y     = fromTop ? rand(-20, 0) : rand(-20, confettiCanvas.height);
      this.size  = rand(5, 11);
      this.speedX = rand(-1.5, 1.5);
      this.speedY = rand(2, 5);
      this.rot   = rand(0, 360);
      this.rotS  = rand(-3, 3);
      this.color = confettiColors[Math.floor(rand(0, confettiColors.length))];
      this.shape = Math.random() > 0.5 ? 'rect' : 'circle';
      this.alpha = 1;
    }
    update() {
      this.x   += this.speedX;
      this.y   += this.speedY;
      this.rot += this.rotS;
      if (this.y > confettiCanvas.height + 20) this.reset(true);
    }
    draw(c) {
      c.save();
      c.globalAlpha = this.alpha;
      c.fillStyle   = this.color;
      c.translate(this.x, this.y);
      c.rotate(this.rot * Math.PI / 180);
      if (this.shape === 'rect') {
        c.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
      } else {
        c.beginPath();
        c.arc(0, 0, this.size / 2.5, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    }
  }

  function launchConfetti() {
    if (confettiRunning) return;
    confettiRunning = true;
    resizeCanvas();

    confettiParticles = Array.from({ length: 120 }, () => new Particle());

    let frame = 0;
    const totalFrames = 220;
 
    function animate() {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      confettiParticles.forEach(p => { p.update(); p.draw(ctx); });
      frame++;
      // Fade out after 180 frames
      if (frame > 180) {
        confettiParticles.forEach(p => { p.alpha = Math.max(0, p.alpha - 0.015); });
      }
      if (frame < totalFrames) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        confettiRunning = false;
      }
    }
    animate();
  }

  confettiBtn.addEventListener('click', launchConfetti);

  // Auto-trigger confetti once when footer enters view
  let footerTriggered = false;
  const footerObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && !footerTriggered) {
        footerTriggered = true;
        setTimeout(launchConfetti, 600);
      }
    });
  }, { threshold: 0.4 });
  footerObserver.observe(document.getElementById('footer'));

});