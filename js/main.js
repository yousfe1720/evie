(function () {
  'use strict';

  /* =========================================================
     CONFIG — replace before launch
  ========================================================= */
  var LAUNCH_DATE = new Date("2026-10-25T00:00:00");

  /* =========================================================
     YEAR
  ========================================================= */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* =========================================================
     COUNTDOWN
  ========================================================= */
  var cdDays = document.getElementById('cd-days');
  var cdHours = document.getElementById('cd-hours');
  var cdMins = document.getElementById('cd-mins');
  var cdSecs = document.getElementById('cd-secs');
  var countdownEl = document.getElementById('countdown');
  var launchedEl = document.getElementById('countdown-launched');

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function updateCountdown() {
    var now = new Date();
    var diff = LAUNCH_DATE.getTime() - now.getTime();

    if (diff <= 0) {
      if (countdownEl) countdownEl.hidden = true;
      if (launchedEl) launchedEl.hidden = false;
      clearInterval(countdownTimer);
      return;
    }

    var totalSeconds = Math.floor(diff / 1000);
    var days = Math.floor(totalSeconds / 86400);
    var hours = Math.floor((totalSeconds % 86400) / 3600);
    var mins = Math.floor((totalSeconds % 3600) / 60);
    var secs = totalSeconds % 60;

    if (cdDays) cdDays.textContent = pad(days);
    if (cdHours) cdHours.textContent = pad(hours);
    if (cdMins) cdMins.textContent = pad(mins);
    if (cdSecs) cdSecs.textContent = pad(secs);
  }

  var countdownTimer = null;
  if (cdDays) {
    updateCountdown();
    countdownTimer = setInterval(updateCountdown, 1000);
  }

  /* =========================================================
     PLATFORM "COMING SOON" MODAL
  ========================================================= */
  var modal = document.getElementById('platformModal');
  var modalPlatform = document.getElementById('modalPlatform');
  var platformButtons = document.querySelectorAll('.platform-btn');
  var lastFocused = null;

  function openModal(platformName) {
    if (!modal) return;
    lastFocused = document.activeElement;
    if (modalPlatform) modalPlatform.textContent = platformName;
    modal.hidden = false;
    var closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) closeBtn.focus();
    document.addEventListener('keydown', onModalKeydown);
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.removeEventListener('keydown', onModalKeydown);
    if (lastFocused) lastFocused.focus();
  }

  function onModalKeydown(e) {
    if (e.key === 'Escape') closeModal();
  }

  platformButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      openModal(btn.getAttribute('data-platform') || 'this platform');
    });
  });

  if (modal) {
    modal.querySelectorAll('[data-close]').forEach(function (el) {
      el.addEventListener('click', closeModal);
    });
  }

  /* =========================================================
     VIDEO FALLBACK
  ========================================================= */
  var heroVideo = document.querySelector('.hero-video');
  if (heroVideo) {
    heroVideo.addEventListener('error', function () {
      var frame = heroVideo.closest('.hero-frame');
      if (frame) frame.style.display = 'none';
    });
  }

  /* =========================================================
     ONE QUIET ENTRANCE MOMENT ON LOAD
  ========================================================= */
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var stage = document.querySelector('.hero-stage');
    var launch = document.querySelector('.launch-block');
    [stage, launch].forEach(function (el, i) {
      if (!el) return;
      el.style.opacity = '0';
      el.style.transform = 'translateY(14px)';
      el.style.transition = 'opacity .7s ease, transform .7s cubic-bezier(.22,.61,.36,1)';
      setTimeout(function () {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, 150 + i * 150);
    });
  }
})();