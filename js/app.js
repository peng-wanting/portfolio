/* ============================================
   Wanting Peng Portfolio — App Logic
   ============================================ */

(function () {
    'use strict';

    /* ---------- Project data ---------- */
    const PROJECTS = {
        sparkle: {
            id: 'sparkle',
            name: 'SPARKLE',
            nameCn: '「钻随心动」艺术腕表',
            type: 'Product & CMF Design',
            pageRange: [4, 14],  // inclusive
        },
        rebel: {
            id: 'rebel',
            name: 'REBEL',
            nameCn: '「双子星」机械腕表',
            type: 'Product & CMF Design',
            pageRange: [15, 22],
        },
        island: {
            id: 'island',
            name: 'ISLAND',
            nameCn: '「孤岛」系列首饰',
            type: 'Product & CMF Design',
            pageRange: [23, 28],
        },
        aigc: {
            id: 'aigc',
            name: 'AIGC',
            nameCn: '「未来主义」机械艺术',
            type: 'AIGC Concept Exploration',
            pageRange: [29, 33],
        },
    };

    /* ---------- DOM refs ---------- */
    const homeView = document.getElementById('home-view');
    const projectView = document.getElementById('project-view');
    const projectPages = document.getElementById('project-pages');
    const nav = document.getElementById('nav');

    let observer = null;

    /* ---------- Helpers ---------- */
    const pad2 = (n) => String(n).padStart(2, '0');

    function buildImagePath(projectId, pageNum) {
        return `images/projects/${projectId}/page-${pad2(pageNum)}.png`;
    }

    function showHome(targetSelector) {
        projectView.hidden = true;
        homeView.hidden = false;
        document.title = 'Wanting Peng · Designer Portfolio';
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        setupRevealObserver();

        if (targetSelector) {
            // Absolute-coordinate jump with retries — robust against the
            // display:none -> block layout timing when views are switched.
            const NAV_OFFSET = 72;
            const jumpTo = () => {
                const el = document.querySelector(targetSelector);
                if (!el) return;
                const y = Math.max(0, el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET);
                // 'instant' avoids CSS smooth-scroll animations being cancelled
                // by the repeated retry calls below.
                try {
                    window.scrollTo({ top: y, behavior: 'instant' });
                } catch (_) {
                    window.scrollTo(0, y);
                }
            };
            jumpTo();                          // after un-hide, layout is sync on rect read
            requestAnimationFrame(jumpTo);     // before first paint
            requestAnimationFrame(() => requestAnimationFrame(jumpTo)); // after first paint
            setTimeout(jumpTo, 150);           // after images/lazy layout settle
            setTimeout(jumpTo, 450);
        } else {
            window.scrollTo({ top: 0, behavior: 'auto' });
        }
    }

    function showProject(projectId) {
        const project = PROJECTS[projectId];
        if (!project) return;

        homeView.hidden = true;
        projectView.hidden = false;
        document.title = `${project.name} · Wanting Peng`;

        // Clear and show loading state
        projectPages.innerHTML = '';
        projectPages.classList.add('loading');

        // Build image elements
        const [start, end] = project.pageRange;
        const fragment = document.createDocumentFragment();
        for (let p = start; p <= end; p++) {
            const wrap = document.createElement('div');
            wrap.className = 'project-page';
            const img = document.createElement('img');
            img.src = buildImagePath(projectId, p);
            img.alt = `${project.name} — page ${p - start + 1}`;
            img.loading = 'lazy';
            img.decoding = 'async';
            wrap.appendChild(img);
            fragment.appendChild(wrap);
        }

        projectPages.appendChild(fragment);
        projectPages.classList.remove('loading');

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'auto' });

        // Setup IntersectionObserver for reveal animations
        setupRevealObserver();

        // Update hash
        history.replaceState(null, '', `#project-${projectId}`);
    }

    function setupRevealObserver() {
        if (observer) observer.disconnect();
        if (!('IntersectionObserver' in window)) {
            // Fallback: just show all
            document.querySelectorAll('.reveal, .project-page').forEach(el => el.classList.add('in-view'));
            return;
        }
        observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

        const selector = homeView.hidden ? '.project-page' : '.reveal';
        document.querySelectorAll(selector).forEach(el => observer.observe(el));
    }

    /* ---------- Interactive effects ---------- */
    // Split hero title into animated chars
    function splitHeroTitle() {
        const title = document.getElementById('hero-title');
        if (!title) return;
        const text = title.textContent;
        title.textContent = '';
        title.setAttribute('aria-label', text);
        [...text].forEach((ch, i) => {
            const span = document.createElement('span');
            span.className = 'char';
            span.style.setProperty('--i', i);
            span.textContent = ch === ' ' ? ' ' : ch;
            span.setAttribute('aria-hidden', 'true');
            title.appendChild(span);
        });
    }

    // Mouse spotlight follows cursor
    function initSpotlight() {
        if (window.matchMedia('(hover: none)').matches) return;
        const spotlight = document.getElementById('spotlight');
        if (!spotlight) return;
        let raf = null;
        document.addEventListener('mousemove', (e) => {
            if (raf) return;
            raf = requestAnimationFrame(() => {
                spotlight.style.setProperty('--mx', e.clientX + 'px');
                spotlight.style.setProperty('--my', e.clientY + 'px');
                raf = null;
            });
            document.body.classList.add('mouse-active');
        }, { passive: true });
    }

    // Scroll progress bar
    function initScrollProgress() {
        const bar = document.getElementById('scroll-progress');
        if (!bar) return;
        let raf = null;
        const update = () => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            const p = max > 0 ? window.scrollY / max : 0;
            bar.style.transform = `scaleX(${p})`;
            raf = null;
        };
        window.addEventListener('scroll', () => {
            if (!raf) raf = requestAnimationFrame(update);
        }, { passive: true });
        update();
    }

    /* ---------- Event handlers ---------- */
    function handleProjectClick(e) {
        const card = e.target.closest('[data-project]');
        if (!card) return;
        const projectId = card.dataset.project;
        if (projectId && PROJECTS[projectId]) {
            e.preventDefault();
            showProject(projectId);
        }
    }

    function handleKeydown(e) {
        if (e.key === 'Escape' && !homeView.hidden) return;
        if (e.key === 'Escape' && !projectView.hidden) {
            showHome('#work');
            history.replaceState(null, '', '#work');
        }
    }

    function handleNavClick(e) {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;
        const href = link.getAttribute('href') || '';
        // If a project view is open, return to home first, then scroll
        if (!homeView.hidden) return; // already on home, default anchor will work
        if (link.classList.contains('nav-link')) {
            e.preventDefault();
            showHome(href && href !== '#' ? href : null);
            if (href && href !== '#') {
                history.replaceState(null, '', href);
            } else {
                history.replaceState(null, '', '#');
            }
        }
    }

    function handleScroll() {
        if (window.scrollY > 8) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    }

    /* ---------- Init ---------- */
    function init() {
        // Interactive effects
        splitHeroTitle();
        initSpotlight();
        initScrollProgress();

        // Project cards on the Contents section
        const contentsGrid = document.querySelector('.contents-grid');
        if (contentsGrid) {
            contentsGrid.addEventListener('click', handleProjectClick);
            contentsGrid.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    const card = e.target.closest('.project-card');
                    if (card) {
                        e.preventDefault();
                        card.click();
                    }
                }
            });
        }

        // Nav clicks
        nav.addEventListener('click', handleNavClick);

        // Keyboard
        document.addEventListener('keydown', handleKeydown);

        // Scroll for nav style
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        // Hash routing
        const checkHash = () => {
            const hash = window.location.hash;
            const match = hash.match(/^#project-(sparkle|rebel|island|aigc)$/);
            if (match) {
                showProject(match[1]);
            } else if (hash === '' || hash === '#') {
                if (!homeView.hidden) return;
                showHome();
            } else if (hash.startsWith('#')) {
                // anchor on home — if project view is open, switch back
                if (homeView.hidden) {
                    showHome();
                    setTimeout(() => {
                        const target = document.querySelector(hash);
                        if (target) target.scrollIntoView({ behavior: 'smooth' });
                    }, 60);
                }
            }
        };

        window.addEventListener('hashchange', checkHash);
        checkHash();

        // Reveal animations on home
        if (!homeView.hidden) {
            setupRevealObserver();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
