(() => {
  // Progressive enhancement: content is never hidden while waiting for JavaScript.
  let observer;
  let metricsObserver;
  const groups = [...document.querySelectorAll('.reveal')];
  const root = document.documentElement;
  const metrics = document.querySelector('.featured-project__results');
  const counters = metrics
    ? [...metrics.querySelectorAll('[data-counter]')]
    : [];
  let countersStarted = false;

  const enableHeroMotion = () => {
    if (!location.hash) root.classList.add('motion-ready');
  };

  const removeActiveState = group => {
    group.classList.remove('reveal--active');
  };

  const stopObserving = () => {
    observer?.disconnect();
    observer = undefined;
    metricsObserver?.disconnect();
    metricsObserver = undefined;
    groups.forEach(removeActiveState);
  };

  const animateCounters = () => {
    if (countersStarted || !counters.length) return;

    countersStarted = true;
    const duration = 1100;
    const delay = 180;
    const startAt = performance.now() + delay;
    const formatter = new Intl.NumberFormat('en-US');
    const values = counters.map(counter => ({
      target: Number(counter.dataset.counter),
      output: counter.querySelector('.featured-project__metric-number')
    })).filter(({ target, output }) => Number.isFinite(target) && output);

    const update = now => {
      if (now < startAt) {
        requestAnimationFrame(update);
        return;
      }

      const progress = Math.min((now - startAt) / duration, 1);
      const eased = 1 - (1 - progress) ** 4;

      values.forEach(({ target, output }) => {
        output.textContent = formatter.format(Math.round(target * eased));
      });

      if (progress < 1) {
        requestAnimationFrame(update);
        return;
      }

      values.forEach(({ target, output }) => {
        output.textContent = formatter.format(target);
      });
    };

    values.forEach(({ output }) => {
      output.textContent = '0';
    });
    requestAnimationFrame(update);
  };

  const observeMetrics = () => {
    if (!metrics || typeof window.IntersectionObserver !== 'function') return;

    metricsObserver = new IntersectionObserver(entries => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;

        metricsObserver.unobserve(target);
        animateCounters();
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -12% 0px' });

    metricsObserver.observe(metrics);
  };

  const showAnchorTarget = () => {
    if (!location.hash) return;

    const target = document.getElementById(location.hash.slice(1));
    if (!target || target === document.querySelector('main')) return;

    groups.forEach(group => {
      if (group !== target && !target.contains(group)) return;

      observer?.unobserve(group);
      group.dataset.revealed = 'true';
      removeActiveState(group);
    });
  };

  const observeGroups = () => {
    observer?.disconnect();
    observer = new IntersectionObserver(entries => {
      try {
        entries.forEach(({ target, isIntersecting }) => {
          if (!isIntersecting) return;

          observer.unobserve(target);
          target.dataset.revealed = 'true';

          if (target.contains(document.activeElement) || target.getBoundingClientRect().top < 0) return;

          target.classList.add('reveal--active');
          const finish = () => removeActiveState(target);
          target.addEventListener('animationend', finish, { once: true });
          window.setTimeout(finish, 1200);
        });
      } catch {
        stopObserving();
      }
    }, { threshold: 0.01, rootMargin: '0px 0px -12% 0px' });

    groups.forEach(group => {
      if (!group.dataset.revealed) observer.observe(group);
    });

    showAnchorTarget();
  };

  try {
    enableHeroMotion();
    if (typeof window.IntersectionObserver !== 'function') return;
    observeGroups();
    observeMetrics();

    document.addEventListener('focusin', event => {
      const group = event.target.closest('.reveal');
      if (!group) return;

      observer?.unobserve(group);
      group.dataset.revealed = 'true';
      removeActiveState(group);
    });

    window.addEventListener('hashchange', showAnchorTarget);
  } catch {
    root.classList.remove('motion-ready');
    stopObserving();
  }
})();
