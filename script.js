// --- State Variables ---
        const USERS_KEY = 'h4b_users';
        const AUTH_KEY = 'h4b_current_user';
        const DONATIONS_KEY = 'h4b_donations';

        // --- Helper Functions ---
        function getStorage(key) {
            return JSON.parse(localStorage.getItem(key)) || [];
        }
        function saveStorage(key, data) {
            localStorage.setItem(key, JSON.stringify(data));
        }
        function getCurrentUser() {
            return JSON.parse(localStorage.getItem(AUTH_KEY)) || null;
        }
        function setCurrentUser(user) {
            if (user) {
                localStorage.setItem(AUTH_KEY, JSON.stringify(user));
            } else {
                localStorage.removeItem(AUTH_KEY);
            }
        }
        function showMsg(id, message, type) {
            showToast(message, type);
        }
        
        function showToast(message, type = 'success') {
            const container = document.getElementById('toast-container');
            if (!container) return;
            const toast = document.createElement('div');
            toast.className = `toast-item toast-${type}`;
            toast.innerHTML = `<span style="font-size: 1.4rem;">${type === 'success' ? '✅' : '❌'}</span> <span>${message}</span>`;
            container.appendChild(toast);
            
            setTimeout(() => {
                toast.classList.add('toast-leave');
                setTimeout(() => toast.remove(), 400);
            }, 4000);
        }

        // --- Routing & Navigation ---
        function navigate() {
            const hash = window.location.hash || '#login';
            const user = getCurrentUser();

            // Guard clauses
            if ((hash === '#home' || hash === '#donation') && !user) {
                window.location.hash = '#login';
                return;
            }
            if ((hash === '#login' || hash === '#register') && user) {
                window.location.hash = '#home';
                return;
            }

            // Hide all sections
            document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));

            // Show target section
            const targetSection = document.getElementById(`section-${hash.replace('#', '')}`);
            if (targetSection) targetSection.classList.add('active');

            // Render Navbar
            renderNavbar(user);

            // Execute Page Specific Logic
            if (hash === '#home') renderHome(user);
            if (hash === '#donation') renderDonation(user);

            // Scroll to top
            window.scrollTo(0, 0);
        }

        function renderNavbar(user) {
            const navLinks = document.getElementById('nav-links');
            if (user) {
                navLinks.innerHTML = `
                    <a href="#home">Home</a>
                    <a href="#donation">Donate</a>
                    <a href="#" id="btn-logout" style="color: var(--primary-btn);">Logout</a>
                `;
                document.getElementById('btn-logout').addEventListener('click', (e) => {
                    e.preventDefault();
                    setCurrentUser(null);
                    window.location.hash = '#login';
                });
            } else {
                navLinks.innerHTML = `
                    <a href="#login">Login</a>
                    <a href="#register">Register</a>
                `;
            }
        }

        window.addEventListener('hashchange', navigate);

        // --- Registration Logic ---
        document.getElementById('form-register').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const pass = document.getElementById('reg-password').value;
            const confirm = document.getElementById('reg-confirm').value;

            if (pass !== confirm) {
                showMsg('register-msg', 'Passwords do not match!', 'error');
                return;
            }

            const users = getStorage(USERS_KEY);
            if (users.find(u => u.email === email)) {
                showMsg('register-msg', 'Email is already registered.', 'error');
                return;
            }

            users.push({ name, email, password: pass });
            saveStorage(USERS_KEY, users);

            showMsg('register-msg', 'Registration successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.hash = '#login';
                document.getElementById('form-register').reset();
            }, 1500);
        });

        // --- Login Logic ---
        document.getElementById('form-login').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const pass = document.getElementById('login-password').value;

            const users = getStorage(USERS_KEY);
            const user = users.find(u => u.email === email && u.password === pass);

            if (user) {
                setCurrentUser({ name: user.name, email: user.email });
                document.getElementById('form-login').reset();
                window.location.hash = '#home';
            } else {
                showMsg('login-msg', 'Invalid email or password.', 'error');
            }
        });

        // --- Home Logic ---
        function typeWriterEffect(elementId, text, speed = 50) {
            const el = document.getElementById(elementId);
            if (!el) return;
            el.innerHTML = '';
            let i = 0;
            function type() {
                if (i < text.length) {
                    el.innerHTML += text.charAt(i);
                    i++;
                    setTimeout(type, speed);
                }
            }
            type();
        }

        function animateStats() {
            const stats = document.querySelectorAll('.stat-number');
            stats.forEach(stat => {
                const originalText = stat.getAttribute('data-val');
                if (!originalText) {
                    stat.setAttribute('data-val', stat.innerText);
                }
                const targetText = stat.getAttribute('data-val');
                const targetStr = targetText.replace(/,/g, '').replace(/\+/g, '');
                const target = parseInt(targetStr);
                if (isNaN(target)) return;
                
                stat.innerText = '0';
                
                const updateCounter = () => {
                    const cText = stat.innerText.replace(/,/g, '').replace(/\+/g, '');
                    const c = parseInt(cText) || 0;
                    const increment = target / 40; 
                    if (c < target) {
                        stat.innerText = Math.ceil(c + increment).toLocaleString() + (targetText.includes('+') ? '+' : '');
                        setTimeout(updateCounter, 30);
                    } else {
                        stat.innerText = targetText;
                    }
                };
                updateCounter();
            });
        }

        function renderHome(user) {
            const msg = `Every Breath is a Miracle`;
            typeWriterEffect('welcome-message', msg);
            const subEl = document.querySelector('.hero-subtitle');
            if (subEl) subEl.textContent = `Welcome back to HopeForBabies, ${user.name.split(' ')[0]}.`;
            animateStats();
        }

        // --- Donation Logic ---
        const amountBtns = document.querySelectorAll('.preset-btn');
        const customInput = document.getElementById('custom-amount');

        amountBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                amountBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                customInput.value = btn.dataset.amount;
            });
        });

        customInput.addEventListener('input', () => {
            amountBtns.forEach(b => b.classList.remove('active'));
        });

        document.getElementById('form-donate').addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = customInput.value;
            const user = getCurrentUser();

            if (!amount || amount <= 0) {
                showMsg('donate-msg', 'Please enter a valid amount.', 'error');
                return;
            }

            // Record Donation
            const donations = getStorage(DONATIONS_KEY);
            const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

            donations.unshift({
                email: user.email,
                amount: parseFloat(amount),
                date: date
            });
            saveStorage(DONATIONS_KEY, donations);

            // Celebration!
            if (typeof window.confetti === 'function') {
                window.confetti({
                    particleCount: 200,
                    spread: 90,
                    origin: { y: 0.6 },
                    colors: ['#f43f5e', '#10b981', '#3b82f6', '#f59e0b'],
                    zIndex: 9999
                });
            }
            
            // Small delay to let confetti start before alert blocks thread
            setTimeout(() => {
                // Alert user (Requirement 5)
                alert(`Thank you for your donation of ${amount}, it will be used to purchase incubators for children.`);
            }, 150);

            document.getElementById('form-donate').reset();
            customInput.value = "500";
            amountBtns.forEach(b => b.classList.remove('active'));
            document.querySelector('.preset-btn[data-amount="500"]').classList.add('active');

            renderDonation(user);
        });

        function renderDonation(user) {
            const donations = getStorage(DONATIONS_KEY).filter(d => d.email === user.email);
            const historyContainer = document.getElementById('donation-history');

            if (donations.length === 0) {
                historyContainer.innerHTML = '<div class="empty-state">You haven\'t made any donations yet. Your first gift will save a life.</div>';
                return;
            }

            let html = '<ul class="history-list">';
            donations.forEach(d => {
                html += `
                    <li class="history-item">
                        <div>
                            <span class="history-amount">${d.amount}</span>
                            <div style="font-size: 0.8rem; color: #94a3b8;">Local Currency</div>
                        </div>
                        <div class="history-date">${d.date}</div>
                    </li>
                `;
            });
            html += '</ul>';
            historyContainer.innerHTML = html;
        }

        // --- Cursor Follower Logic ---
        function initCursor() {
            const cursorFollower = document.getElementById('cursor-follower');
            if (cursorFollower) {
                let cursorX = window.innerWidth / 2, cursorY = window.innerHeight / 2;
                let mouseX = cursorX, mouseY = cursorY;

                window.addEventListener('mousemove', (e) => {
                    mouseX = e.clientX;
                    mouseY = e.clientY;
                });

                document.body.addEventListener('mouseenter', (e) => {
                    if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.classList?.contains('preset-btn') || e.target.tagName === 'INPUT') {
                        cursorFollower.classList.add('active');
                    }
                }, true);

                document.body.addEventListener('mouseleave', (e) => {
                    if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.classList?.contains('preset-btn') || e.target.tagName === 'INPUT') {
                        cursorFollower.classList.remove('active');
                    }
                }, true);

                function animateCursor() {
                    cursorX += (mouseX - cursorX) * 0.2;
                    cursorY += (mouseY - cursorY) * 0.2;
                    cursorFollower.style.transform = `translate(calc(${cursorX}px - 50%), calc(${cursorY}px - 50%))`;
                    requestAnimationFrame(animateCursor);
                }
                animateCursor();
            }
        }

        // Initialize application
        window.addEventListener('load', () => {
            initCursor();
            navigate();
            
            // Theme toggle logic
            const themeBtn = document.getElementById('theme-toggle');
            if (themeBtn) {
                const currentTheme = localStorage.getItem('h4b_theme') || 'light';
                if (currentTheme === 'dark') {
                    document.body.classList.add('dark-mode');
                    themeBtn.textContent = '☀️';
                }
                themeBtn.addEventListener('click', () => {
                    document.body.classList.toggle('dark-mode');
                    if (document.body.classList.contains('dark-mode')) {
                        localStorage.setItem('h4b_theme', 'dark');
                        themeBtn.textContent = '☀️';
                    } else {
                        localStorage.setItem('h4b_theme', 'light');
                        themeBtn.textContent = '🌙';
                    }
                });
            }
            
            // Vanilla Tilt Init
            if (typeof VanillaTilt !== 'undefined') {
                VanillaTilt.init(document.querySelectorAll(".feature-card, .stat-card, #section-login .card, #section-register .card"), {
                    max: 8,
                    speed: 400,
                    glare: true,
                    "max-glare": 0.1,
                    scale: 1.02
                });
            }
        });
