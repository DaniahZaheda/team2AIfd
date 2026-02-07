// 📁 animations.js - جميع الأنيميشنات للعبة الرياضيات

const GameAnimations = {
    // ============= المتغيرات =============
    animations: {
        numbers: [],
        shapes: [],
        particles: [],
        confetti: [],
        mouseTrail: []
    },

    // ============= التهيئة =============
    init() {
        console.log('🎨 تهيئة الأنيميشنات...');

        // إنشاء الحاويات
        this.createContainers();

        // بدء الأنيميشنات
        this.startAllAnimations();

        // إعداد تفاعلات الماوس
        this.setupMouseInteractions();

        // إعداد تفاعلات العناصر
        this.setupElementAnimations();

        console.log('✅ الأنيميشنات جاهزة!');
    },

    // ============= إنشاء الحاويات =============
    createContainers() {
        // حاوية الأرقام العائمة
        const numbersContainer = document.createElement('div');
        numbersContainer.id = 'floating-numbers';
        numbersContainer.className = 'floating-container';
        document.body.appendChild(numbersContainer);

        // حاوية الأشكال العائمة
        const shapesContainer = document.createElement('div');
        shapesContainer.id = 'floating-shapes';
        shapesContainer.className = 'floating-container';
        document.body.appendChild(shapesContainer);

        // حاوية أثر الماوس
        const mouseTrailContainer = document.createElement('div');
        mouseTrailContainer.id = 'mouse-trail';
        mouseTrailContainer.className = 'mouse-trail-container';
        document.body.appendChild(mouseTrailContainer);
    },

    // ============= بدء جميع الأنيميشنات =============
    startAllAnimations() {
        // الأرقام العائمة
        this.startFloatingNumbers();

        // الأشكال العائمة
        this.startFloatingShapes();

        // الجسيمات الخلفية
        this.startBackgroundParticles();

        // النجوم المتساقطة
        this.startFallingStars();

        // الفقاعات
        this.startFloatingBubbles();

        // توهج الخلفية
        this.startBackgroundGlow();
    },

    // ============= الأرقام العائمة =============
    startFloatingNumbers() {
        const container = document.getElementById('floating-numbers');
        if (!container) return;

        const numbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '➕', '➖', '✖️', '➗', '＝', '≠', '√', '∞', 'π', '∑','🍉','🫒','𓂆','🕊️'];

        for (let i = 0; i < 25; i++) {
            setTimeout(() => {
                this.createFloatingNumber(container, numbers);
            }, i * 300);
        }

        // الاستمرار في إنشاء أرقام جديدة
        setInterval(() => {
            if (this.animations.numbers.length < 30) {
                this.createFloatingNumber(container, numbers);
            }
        }, 2000);
    },

    createFloatingNumber(container, numbers) {
        const number = document.createElement('div');
        number.className = 'floating-number';

        // اختيار رقم عشوائي
        const randomNumber = numbers[Math.floor(Math.random() * numbers.length)];
        number.textContent = randomNumber;

        // إعدادات عشوائية
        const size = Math.random() * 40 + 20;
        const left = Math.random() * 100;
        const duration = Math.random() * 20 + 15;
        const delay = Math.random() * 5;
        const opacity = Math.random() * 0.4 + 0.1;

        // تطبيق الأنيميشن
        number.style.cssText = `
            position: fixed;
            font-size: ${size}px;
            left: ${left}vw;
            top: 110%;
            opacity: ${opacity};
            pointer-events: none;
            z-index: -1;
            user-select: none;
            filter: drop-shadow(0 0 10px rgba(255,255,255,0.3));
            animation: floatNumber ${duration}s linear ${delay}s infinite;
        `;

        // إضافة أنيميشن CSS ديناميكي
        this.addAnimationCSS('floatNumber', `
            @keyframes floatNumber {
                0% {
                    transform: translateY(0) rotate(0deg) scale(1);
                    opacity: ${opacity};
                }
                10% {
                    opacity: ${opacity * 1.5};
                }
                90% {
                    opacity: ${opacity};
                }
                100% {
                    transform: translateY(-120vh) rotate(${Math.random() * 360}deg) scale(${Math.random() * 0.5 + 0.5});
                    opacity: 0;
                }
            }
        `);

        container.appendChild(number);
        this.animations.numbers.push(number);

        // إزالة العنصر بعد انتهاء الأنيميشن
        setTimeout(() => {
            if (number.parentNode) {
                number.parentNode.removeChild(number);
                this.animations.numbers = this.animations.numbers.filter(n => n !== number);
            }
        }, (duration + delay) * 1000);
    },

    // ============= الأشكال العائمة =============
    startFloatingShapes() {
        const container = document.getElementById('floating-shapes');
        if (!container) return;

        const shapes = ['🔺', '▲', '🔵', '●', '◼️', '■', '⭐', '★', '🔶', '◇', '🟣', '◆', '🔷', '❖', '➕', '✖️', '➗'];

        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                this.createFloatingShape(container, shapes);
            }, i * 400);
        }

        setInterval(() => {
            if (this.animations.shapes.length < 25) {
                this.createFloatingShape(container, shapes);
            }
        }, 3000);
    },

    createFloatingShape(container, shapes) {
        const shape = document.createElement('div');
        shape.className = 'floating-shape';

        const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
        shape.textContent = randomShape;

        const size = Math.random() * 50 + 30;
        const left = Math.random() * 100;
        const duration = Math.random() * 25 + 20;
        const delay = Math.random() * 3;
        const opacity = Math.random() * 0.3 + 0.05;
        const color = this.getRandomColor();

        shape.style.cssText = `
            position: fixed;
            font-size: ${size}px;
            left: ${left}vw;
            top: 110%;
            opacity: ${opacity};
            pointer-events: none;
            z-index: -1;
            user-select: none;
            color: ${color};
            filter: drop-shadow(0 0 15px ${color}40);
            animation: floatShape ${duration}s ease-in-out ${delay}s infinite;
        `;

        this.addAnimationCSS('floatShape', `
            @keyframes floatShape {
                0% {
                    transform: translateY(0) rotate(0deg) scale(0.8);
                    opacity: ${opacity};
                }
                25% {
                    transform: translateX(${Math.random() * 100 - 50}px) rotate(90deg) scale(1);
                }
                50% {
                    transform: translateX(${Math.random() * 100 - 50}px) rotate(180deg) scale(1.2);
                    opacity: ${opacity * 1.5};
                }
                75% {
                    transform: translateX(${Math.random() * 100 - 50}px) rotate(270deg) scale(1);
                }
                100% {
                    transform: translateY(-120vh) rotate(360deg) scale(0.8);
                    opacity: 0;
                }
            }
        `);

        container.appendChild(shape);
        this.animations.shapes.push(shape);

        setTimeout(() => {
            if (shape.parentNode) {
                shape.parentNode.removeChild(shape);
                this.animations.shapes = this.animations.shapes.filter(s => s !== shape);
            }
        }, (duration + delay) * 1000);
    },

    // ============= الجسيمات الخلفية =============
    startBackgroundParticles() {
        const colors = ['#FF5252', '#FF9800', '#FFEB3B', '#4CAF50', '#2196F3', '#9C27B0'];

        setInterval(() => {
            if (this.animations.particles.length < 100) {
                this.createBackgroundParticle(colors);
            }
        }, 100);
    },

    createBackgroundParticle(colors) {
        const particle = document.createElement('div');
        particle.className = 'background-particle';

        const size = Math.random() * 6 + 2;
        const left = Math.random() * 100;
        const duration = Math.random() * 10 + 5;
        const color = colors[Math.floor(Math.random() * colors.length)];

        particle.style.cssText = `
            position: fixed;
            width: ${size}px;
            height: ${size}px;
            left: ${left}vw;
            top: 110%;
            background: ${color};
            border-radius: 50%;
            pointer-events: none;
            z-index: -2;
            opacity: 0.15;
            box-shadow: 0 0 ${size * 2}px ${color};
            animation: floatParticle ${duration}s linear infinite;
        `;

        this.addAnimationCSS('floatParticle', `
            @keyframes floatParticle {
                0% {
                    transform: translateY(0) rotate(0deg);
                    opacity: 0;
                }
                10% {
                    opacity: 0.15;
                }
                90% {
                    opacity: 0.15;
                }
                100% {
                    transform: translateY(-120vh) rotate(360deg);
                    opacity: 0;
                }
            }
        `);

        document.body.appendChild(particle);
        this.animations.particles.push(particle);

        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
                this.animations.particles = this.animations.particles.filter(p => p !== particle);
            }
        }, duration * 1000);
    },

    // ============= النجوم المتساقطة =============
    startFallingStars() {
        setInterval(() => {
            if (Math.random() > 0.7) {
                this.createFallingStar();
            }
        }, 2000);
    },

    createFallingStar() {
        const star = document.createElement('div');
        star.className = 'falling-star';
        star.innerHTML = '⭐';

        const left = Math.random() * 100;
        const duration = Math.random() * 3 + 2;
        const size = Math.random() * 30 + 20;
        const opacity = Math.random() * 0.8 + 0.2;

        star.style.cssText = `
            position: fixed;
            font-size: ${size}px;
            left: ${left}vw;
            top: -50px;
            opacity: ${opacity};
            pointer-events: none;
            z-index: 1;
            user-select: none;
            filter: drop-shadow(0 0 10px gold);
            animation: fallStar ${duration}s ease-in infinite;
        `;

        this.addAnimationCSS('fallStar', `
            @keyframes fallStar {
                0% {
                    transform: translateY(0) rotate(0deg) scale(0.5);
                    opacity: 0;
                }
                10% {
                    opacity: ${opacity};
                    transform: scale(1);
                }
                90% {
                    opacity: ${opacity};
                }
                100% {
                    transform: translateY(100vh) rotate(360deg) scale(0.5);
                    opacity: 0;
                }
            }
        `);

        document.body.appendChild(star);

        setTimeout(() => {
            if (star.parentNode) {
                star.parentNode.removeChild(star);
            }
        }, duration * 1000);
    },

    // ============= الفقاعات =============
    startFloatingBubbles() {
        setInterval(() => {
            if (Math.random() > 0.5) {
                this.createBubble();
            }
        }, 1500);
    },

    createBubble() {
        const bubble = document.createElement('div');
        bubble.className = 'floating-bubble';

        const size = Math.random() * 80 + 40;
        const left = Math.random() * 100;
        const duration = Math.random() * 15 + 10;
        const opacity = Math.random() * 0.1 + 0.05;

        bubble.style.cssText = `
            position: fixed;
            width: ${size}px;
            height: ${size}px;
            left: ${left}vw;
            top: 110%;
            background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 70%, transparent 100%);
            border: 2px solid rgba(255,255,255,0.2);
            border-radius: 50%;
            pointer-events: none;
            z-index: -1;
            opacity: ${opacity};
            animation: floatBubble ${duration}s ease-in-out infinite;
        `;

        this.addAnimationCSS('floatBubble', `
            @keyframes floatBubble {
                0% {
                    transform: translateY(0) scale(1) translateX(0);
                    opacity: 0;
                }
                10% {
                    opacity: ${opacity};
                }
                50% {
                    transform: translateX(${Math.random() * 100 - 50}px) scale(${Math.random() * 0.3 + 0.9});
                }
                90% {
                    opacity: ${opacity};
                }
                100% {
                    transform: translateY(-120vh) scale(${Math.random() * 0.5 + 0.5}) translateX(${Math.random() * 100 - 50}px);
                    opacity: 0;
                }
            }
        `);

        document.body.appendChild(bubble);

        setTimeout(() => {
            if (bubble.parentNode) {
                bubble.parentNode.removeChild(bubble);
            }
        }, duration * 1000);
    },

    // ============= توهج الخلفية =============
    startBackgroundGlow() {
        const glow = document.createElement('div');
        glow.className = 'background-glow';

        glow.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -3;
            background: radial-gradient(circle at 50% 50%, rgba(156, 39, 176, 0.1) 0%, transparent 70%);
            animation: pulseGlow 8s ease-in-out infinite alternate;
        `;

        this.addAnimationCSS('pulseGlow', `
            @keyframes pulseGlow {
                0% {
                    opacity: 0.3;
                    transform: scale(1);
                    background: radial-gradient(circle at 30% 30%, rgba(156, 39, 176, 0.1) 0%, transparent 70%);
                }
                33% {
                    background: radial-gradient(circle at 70% 30%, rgba(33, 150, 243, 0.1) 0%, transparent 70%);
                }
                66% {
                    background: radial-gradient(circle at 30% 70%, rgba(76, 175, 80, 0.1) 0%, transparent 70%);
                }
                100% {
                    opacity: 0.5;
                    transform: scale(1.2);
                    background: radial-gradient(circle at 70% 70%, rgba(255, 152, 0, 0.1) 0%, transparent 70%);
                }
            }
        `);

        document.body.appendChild(glow);
    },

    // ============= الكونفيتي (للاحتفالات) =============
    createConfetti(count = 200) {
        const colors = ['#FF5252', '#FF9800', '#FFEB3B', '#4CAF50', '#2196F3', '#9C27B0'];
        const container = document.getElementById('confetti-container') || document.body;

        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti-particle';

                const color = colors[Math.floor(Math.random() * colors.length)];
                const size = Math.random() * 15 + 5;
                const left = Math.random() * 100;
                const duration = Math.random() * 3 + 2;
                const delay = Math.random() * 1;
                const shape = Math.random() > 0.5 ? 'square' : 'circle';
                const rotation = Math.random() * 720;

                confetti.style.cssText = `
                    position: fixed;
                    width: ${size}px;
                    height: ${size}px;
                    left: ${left}vw;
                    top: -50px;
                    background: ${color};
                    border-radius: ${shape === 'circle' ? '50%' : '2px'};
                    pointer-events: none;
                    z-index: 1000;
                    opacity: 0.9;
                    box-shadow: 0 0 10px ${color};
                    animation: confettiFall ${duration}s ease-out ${delay}s forwards;
                `;

                this.addAnimationCSS('confettiFall', `
                    @keyframes confettiFall {
                        0% {
                            transform: translateY(0) rotate(0deg) scale(0.5);
                            opacity: 0;
                        }
                        10% {
                            opacity: 0.9;
                            transform: scale(1);
                        }
                        90% {
                            opacity: 0.9;
                        }
                        100% {
                            transform: translateY(100vh) rotate(${rotation}deg) scale(0.5);
                            opacity: 0;
                        }
                    }
                `);

                container.appendChild(confetti);
                this.animations.confetti.push(confetti);

                setTimeout(() => {
                    if (confetti.parentNode) {
                        confetti.parentNode.removeChild(confetti);
                        this.animations.confetti = this.animations.confetti.filter(c => c !== confetti);
                    }
                }, (duration + delay) * 1000);
            }, i * 10);
        }
    },


    // ============= كونفيتي نجوم (مختلفة للاحتفال) =============
    createStarConfetti(count = 120) {
        const container = document.getElementById('confetti-container') || document.body;
        const stars = ['⭐','✨','🌟','💛'];
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const s = document.createElement('div');
                s.className = 'confetti-star';
                const left = Math.random() * 100;
                const duration = Math.random() * 2.2 + 1.6;
                const size = Math.random() * 22 + 14;
                s.textContent = stars[Math.floor(Math.random() * stars.length)];
                s.style.cssText = `
                    position: absolute;
                    top: -30px;
                    left: ${left}%;
                    font-size: ${size}px;
                    opacity: 1;
                    transform: translateY(-20px) rotate(0deg);
                    pointer-events: none;
                    filter: drop-shadow(0 6px 12px rgba(0,0,0,0.25));
                    animation: starFall ${duration}s linear forwards;
                `;
                container.appendChild(s);
                setTimeout(() => { try { s.remove(); } catch(e){} }, (duration+0.2)*1000);
            }, Math.random() * 220);
        }

        // inject keyframes once
        if (!document.getElementById('starFallKeyframes')) {
            const style = document.createElement('style');
            style.id = 'starFallKeyframes';
            style.textContent = `
                @keyframes starFall {
                    0% { transform: translateY(-40px) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(110vh) rotate(540deg); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    },


    // ============= أثر الماوس =============
    setupMouseInteractions() {
        const container = document.getElementById('mouse-trail');
        if (!container) return;

        let mouseX = 0;
        let mouseY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            this.createMouseTrail(mouseX, mouseY, container);

            // تأثير على العناصر القريبة
            this.applyHoverEffect(e);
        });

        // تأثير النقر
        document.addEventListener('click', (e) => {
            this.createClickEffect(e.clientX, e.clientY);
        });
    },

    createMouseTrail(x, y, container) {
        if (this.animations.mouseTrail.length > 15) {
            const oldest = this.animations.mouseTrail.shift();
            if (oldest && oldest.parentNode) {
                oldest.parentNode.removeChild(oldest);
            }
        }

        const trail = document.createElement('div');
        trail.className = 'mouse-trail-dot';

        const size = Math.random() * 10 + 5;
        const color = this.getRandomColor();

        trail.style.cssText = `
            position: fixed;
            width: ${size}px;
            height: ${size}px;
            left: ${x - size / 2}px;
            top: ${y - size / 2}px;
            background: radial-gradient(circle, ${color} 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 999;
            opacity: 0.7;
            animation: trailFade 0.5s ease-out forwards;
        `;

        this.addAnimationCSS('trailFade', `
            @keyframes trailFade {
                0% {
                    opacity: 0.7;
                    transform: scale(1);
                }
                100% {
                    opacity: 0;
                    transform: scale(0);
                }
            }
        `);

        container.appendChild(trail);
        this.animations.mouseTrail.push(trail);

        setTimeout(() => {
            if (trail.parentNode) {
                trail.parentNode.removeChild(trail);
                this.animations.mouseTrail = this.animations.mouseTrail.filter(t => t !== trail);
            }
        }, 500);
    },

    createClickEffect(x, y) {
        const effect = document.createElement('div');
        effect.className = 'click-effect';

        const size = 50;
        const color = this.getRandomColor();

        effect.style.cssText = `
            position: fixed;
            width: ${size}px;
            height: ${size}px;
            left: ${x - size / 2}px;
            top: ${y - size / 2}px;
            border: 3px solid ${color};
            border-radius: 50%;
            pointer-events: none;
            z-index: 998;
            opacity: 0.7;
            animation: clickRipple 0.6s ease-out forwards;
        `;

        this.addAnimationCSS('clickRipple', `
            @keyframes clickRipple {
                0% {
                    transform: scale(0.1);
                    opacity: 0.7;
                }
                100% {
                    transform: scale(2);
                    opacity: 0;
                }
            }
        `);

        document.body.appendChild(effect);

        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 600);
    },

    applyHoverEffect(e) {
        const elements = document.elementsFromPoint(e.clientX, e.clientY);

        elements.forEach(el => {
            if (el.classList.contains('answer-button') ||
                el.classList.contains('btn') ||
                el.classList.contains('subject-card')) {

                if (!el.hasAttribute('data-hovering')) {
                    el.setAttribute('data-hovering', 'true');
                    this.animateElementHover(el);
                }
            }
        });
    },

    animateElementHover(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // توهج حول العنصر
        const glow = document.createElement('div');
        glow.className = 'element-glow';

        glow.style.cssText = `
            position: fixed;
            width: ${rect.width + 40}px;
            height: ${rect.height + 40}px;
            left: ${rect.left - 20}px;
            top: ${rect.top - 20}px;
            border-radius: inherit;
            pointer-events: none;
            z-index: 1;
            background: radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, transparent 70%);
            animation: glowPulse 0.5s ease-in-out;
        `;

        this.addAnimationCSS('glowPulse', `
            @keyframes glowPulse {
                0% { opacity: 0; transform: scale(0.8); }
                50% { opacity: 0.5; transform: scale(1.1); }
                100% { opacity: 0; transform: scale(1); }
            }
        `);

        document.body.appendChild(glow);

        setTimeout(() => {
            if (glow.parentNode) {
                glow.parentNode.removeChild(glow);
            }
            element.removeAttribute('data-hovering');
        }, 500);
    },

    // ============= أنيميشنات العناصر =============
    setupElementAnimations() {
        // أنيميشن للأزرار
        this.setupButtonAnimations();

        // أنيميشن للبطاقات
        this.setupCardAnimations();

        // أنيميشن للأسئلة
        this.setupQuestionAnimations();

        // أنيميشن للإجابات الصحيحة/الخاطئة
        this.setupAnswerAnimations();
    },

    setupButtonAnimations() {
        document.addEventListener('DOMContentLoaded', () => {
            const buttons = document.querySelectorAll('.btn, .answer-button, .mode-select-btn');

            buttons.forEach(btn => {
                // اهتزاز خفيفة عند المرور
                btn.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-3px)';
                    this.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)';

                    // توهج خفيف
                    const glow = document.createElement('div');
                    glow.className = 'button-glow';
                    glow.style.cssText = `
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        border-radius: inherit;
                        background: radial-gradient(circle at center, rgba(255,255,255,0.3) 0%, transparent 70%);
                        animation: buttonGlow 0.5s ease-in-out;
                    `;

                    this.appendChild(glow);

                    setTimeout(() => {
                        if (glow.parentNode) {
                            glow.parentNode.removeChild(glow);
                        }
                    }, 500);
                });

                btn.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = '';
                });

                // تأثير النقر
                btn.addEventListener('mousedown', function() {
                    this.style.transform = 'translateY(1px) scale(0.98)';
                });

                btn.addEventListener('mouseup', function() {
                    this.style.transform = 'translateY(-3px)';
                    setTimeout(() => {
                        this.style.transform = 'translateY(0)';
                    }, 150);
                });

                // أنيميشن دورية للأزرار المهمة
                if (btn.classList.contains('start-button') || btn.classList.contains('important-btn')) {
                    this.addPulseAnimation(btn);
                }
            });
        });
    },

    setupCardAnimations() {
        document.addEventListener('DOMContentLoaded', () => {
            const cards = document.querySelectorAll('.subject-card, .mode-card, .topic-card, .recommendation-card');

            cards.forEach(card => {
                card.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-10px) rotateX(5deg)';
                    this.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)';

                    // تأثير توهج الحدود
                    const borderGlow = document.createElement('div');
                    borderGlow.className = 'border-glow';
                    borderGlow.style.cssText = `
                        position: absolute;
                        top: -2px;
                        left: -2px;
                        right: -2px;
                        bottom: -2px;
                        border-radius: inherit;
                        border: 2px solid var(--grade4-accent);
                        pointer-events: none;
                        animation: borderPulse 2s ease-in-out infinite;
                        z-index: 1;
                    `;

                    this.appendChild(borderGlow);
                });

                card.addEventListener('mouseleave', function() {
                    this.style.transform = '';
                    this.style.boxShadow = '';

                    const borderGlow = this.querySelector('.border-glow');
                    if (borderGlow) {
                        borderGlow.remove();
                    }
                });
            });
        });
    },

    setupQuestionAnimations() {
        // أنيميشن ظهور السؤال
        this.addAnimationCSS('questionAppear', `
            @keyframes questionAppear {
                0% {
                    opacity: 0;
                    transform: translateY(30px) scale(0.9);
                }
                70% {
                    transform: translateY(-5px) scale(1.02);
                }
                100% {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
        `);

        // أنيميشن اختفاء السؤال
        this.addAnimationCSS('questionDisappear', `
            @keyframes questionDisappear {
                0% {
                    opacity: 1;
                    transform: scale(1);
                }
                100% {
                    opacity: 0;
                    transform: scale(0.8) rotate(-5deg);
                }
            }
        `);
    },

    setupAnswerAnimations() {
        // أنيميشن الإجابة الصحيحة
        this.addAnimationCSS('correctAnswerAnimation', `
            @keyframes correctAnswerAnimation {
                0% {
                    background: linear-gradient(45deg, #4CAF50, #8BC34A);
                    transform: scale(1);
                }
                25% {
                    transform: scale(1.1) rotate(5deg);
                }
                50% {
                    background: linear-gradient(45deg, #8BC34A, #4CAF50);
                    transform: scale(1.15) rotate(-5deg);
                    box-shadow: 0 0 40px #4CAF50;
                }
                75% {
                    transform: scale(1.1) rotate(5deg);
                }
                100% {
                    background: linear-gradient(45deg, #4CAF50, #8BC34A);
                    transform: scale(1);
                }
            }
        `);

        // أنيميشن الإجابة الخاطئة
        this.addAnimationCSS('wrongAnswerAnimation', `
            @keyframes wrongAnswerAnimation {
                0% {
                    background: linear-gradient(45deg, #F44336, #FF5252);
                    transform: scale(1);
                }
                25% {
                    transform: scale(0.9) rotate(-5deg);
                }
                50% {
                    background: linear-gradient(45deg, #FF5252, #F44336);
                    transform: scale(0.85) rotate(5deg);
                    box-shadow: 0 0 40px #F44336;
                }
                75% {
                    transform: scale(0.9) rotate(-5deg);
                }
                100% {
                    background: linear-gradient(45deg, #F44336, #FF5252);
                    transform: scale(1);
                }
            }
        `);
    },

    // ============= أنيميشنات خاصة =============
    animateCorrectAnswer(element) {
        if (!element) return;

        element.style.animation = 'correctAnswerAnimation 0.8s ease';

        // نجوم صغيرة تخرج من الزر
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                this.createStarBurst(element);
            }, i * 80);
        }

        setTimeout(() => {
            element.style.animation = '';
        }, 800);
    },

    animateWrongAnswer(element) {
        if (!element) return;

        element.style.animation = 'wrongAnswerAnimation 0.8s ease';

        // اهتزاز الشاشة
        document.body.style.transform = 'translateX(5px)';
        setTimeout(() => {
            document.body.style.transform = 'translateX(-5px)';
            setTimeout(() => {
                document.body.style.transform = 'translateX(0)';
            }, 50);
        }, 50);

        setTimeout(() => {
            element.style.animation = '';
        }, 800);
    },

    createStarBurst(sourceElement) {
        const rect = sourceElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const star = document.createElement('div');
        star.innerHTML = '⭐';
        star.style.cssText = `
            position: fixed;
            font-size: 1.5rem;
            left: ${centerX}px;
            top: ${centerY}px;
            pointer-events: none;
            z-index: 1000;
            opacity: 0;
            animation: starBurst 1s ease-out forwards;
        `;

        this.addAnimationCSS('starBurst', `
            @keyframes starBurst {
                0% {
                    transform: translate(0, 0) scale(0) rotate(0deg);
                    opacity: 0;
                }
                20% {
                    opacity: 1;
                    transform: scale(1);
                }
                100% {
                    transform: translate(${Math.random() * 200 - 100}px, ${Math.random() * 200 - 100}px) scale(0) rotate(360deg);
                    opacity: 0;
                }
            }
        `);

        document.body.appendChild(star);

        setTimeout(() => {
            if (star.parentNode) {
                star.parentNode.removeChild(star);
            }
        }, 1000);
    },

    // ============= أنيميشن النتائج =============
    createResultsCelebration() {
        // كونفيتي
        this.createConfetti(300);

        // نجوم متساقطة كثيفة
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                this.createFallingStar();
            }, i * 50);
        }

        // توهج الشاشة
        const screenGlow = document.createElement('div');
        screenGlow.className = 'celebration-glow';
        screenGlow.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 999;
            background: radial-gradient(circle at center, rgba(255,215,0,0.3) 0%, transparent 70%);
            animation: celebrationPulse 2s ease-in-out infinite;
        `;

        this.addAnimationCSS('celebrationPulse', `
            @keyframes celebrationPulse {
                0%, 100% { opacity: 0.3; transform: scale(1); }
                50% { opacity: 0.5; transform: scale(1.1); }
            }
        `);

        document.body.appendChild(screenGlow);

        setTimeout(() => {
            if (screenGlow.parentNode) {
                screenGlow.parentNode.removeChild(screenGlow);
            }
        }, 5000);
    },

    // ============= أنيميشن المستويات =============
    animateLevelUp(level) {
        const levelUp = document.createElement('div');
        levelUp.className = 'level-up-animation';

        levelUp.innerHTML = `
            <div class="level-up-text">🎉 ${level} 🎉</div>
            <div class="level-up-stars">⭐⭐⭐⭐⭐</div>
        `;

        levelUp.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 4rem;
            color: gold;
            text-align: center;
            pointer-events: none;
            z-index: 1001;
            animation: levelUpShow 2s ease-out forwards;
        `;

        this.addAnimationCSS('levelUpShow', `
            @keyframes levelUpShow {
                0% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.5);
                }
                20% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1.2);
                }
                40% {
                    transform: translate(-50%, -50%) scale(1);
                }
                80% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
                100% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(1.5);
                }
            }
        `);

        document.body.appendChild(levelUp);

        setTimeout(() => {
            if (levelUp.parentNode) {
                levelUp.parentNode.removeChild(levelUp);
            }
        }, 2000);
    },

    // ============= دوال مساعدة =============
    addAnimationCSS(name, css) {
        if (!document.getElementById(`animation-${name}`)) {
            const style = document.createElement('style');
            style.id = `animation-${name}`;
            style.textContent = css;
            document.head.appendChild(style);
        }
    },

    getRandomColor() {
        const colors = [
            '#FF5252', '#FF9800', '#FFC107', '#FFEB3B',
            '#CDDC39', '#8BC34A', '#4CAF50', '#009688',
            '#00BCD4', '#03A9F4', '#2196F3', '#3F51B5',
            '#673AB7', '#9C27B0', '#E91E63', '#F44336'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },

    addPulseAnimation(element) {
        element.style.animation = 'pulseGlow 2s ease-in-out infinite';

        this.addAnimationCSS('pulseGlow', `
            @keyframes pulseGlow {
                0%, 100% {
                    box-shadow: 0 0 20px rgba(255, 152, 0, 0.5);
                }
                50% {
                    box-shadow: 0 0 40px rgba(255, 152, 0, 0.8);
                }
            }
        `);
    },

    // ============= التحكم في الأنيميشنات =============
    pauseAllAnimations() {
        // إيقاف جميع الأنيميشنات
        document.querySelectorAll('*').forEach(el => {
            const animation = el.style.animation;
            if (animation) {
                el.setAttribute('data-animation-backup', animation);
                el.style.animation = 'none';
            }
        });
    },

    resumeAllAnimations() {
        // استئناف الأنيميشنات
        document.querySelectorAll('*').forEach(el => {
            const backup = el.getAttribute('data-animation-backup');
            if (backup) {
                el.style.animation = backup;
                el.removeAttribute('data-animation-backup');
            }
        });
    },

    clearAllAnimations() {
        // مسح جميع العناصر المتحركة
        Object.values(this.animations).flat().forEach(el => {
            if (el && el.parentNode) {
                el.parentNode.removeChild(el);
            }
        });

        this.animations = {
            numbers: [],
            shapes: [],
            particles: [],
            confetti: [],
            mouseTrail: []
        };
    }
};

// ============= التصدير والتهيئة =============
window.GameAnimations = GameAnimations;

// تهيئة الأنيميشنات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    GameAnimations.init();
});

console.log('🎨 نظام الأنيميشنات جاهز للاستخدام!');