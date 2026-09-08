(function () {
  'use strict';

  /* =========================================================
     CONFIG
  ========================================================= */
  var GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzCyCs2UXGJARO1bCbz1tz_Msrb11f4mebto39H3LPj-aLeT8HCGmUmVqc4pwfUTmVV/exec';

  var form = document.getElementById('waitlistForm');
  var messageEl = document.getElementById('waitlistFeedback');
  var submitBtn = document.getElementById('waitlistSubmit');
  var emailInput = document.getElementById('waitlistEmail');
  var honeypot = document.getElementById('waitlistHoneypot');

  if (!form) return;

  /* =========================================================
     FORM SUBMIT
  ========================================================= */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearMessage();

    if (emailInput && !emailInput.checkValidity()) {
      showMessage('Please enter a valid email address.', 'error');
      emailInput.focus();
      return;
    }

    // Honeypot check: real visitors never see or fill this field.
    // If it has a value, silently pretend success (don't tip off the bot).
    if (honeypot && honeypot.value) {
      form.reset();
      showSuccessToast();
      return;
    }

    var originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Joining...';
    showMessage('Submitting...', 'muted');

    var params = new URLSearchParams();
    params.append('email', emailInput ? emailInput.value : '');

    fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: params
    })
      .then(function (response) {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(function (data) {
        if (data && data.result === 'success') {
          clearMessage();
          form.reset();
          showSuccessToast();
        } else {
          showMessage((data && data.message) || 'Something went wrong. Please try again.', 'error');
        }
      })
      .catch(function () {
        showMessage('Connection error. Please try again in a moment.', 'error');
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      });
  });

  function showMessage(text, kind) {
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.classList.remove('is-error', 'is-success');
    if (kind === 'error') messageEl.classList.add('is-error');
    if (kind === 'success') messageEl.classList.add('is-success');
  }

  function clearMessage() {
    if (!messageEl) return;
    messageEl.textContent = '';
    messageEl.classList.remove('is-error', 'is-success');
  }

  /* =========================================================
     FLOATING SUCCESS CONFIRMATION
  ========================================================= */
  var toast = document.getElementById('successToast');
  var toastClose = document.getElementById('toastClose');
  var toastOk = document.getElementById('toastOk');
  var toastAutoHideTimer = null;

  function showSuccessToast() {
    if (!toast) return;
    clearTimeout(toastAutoHideTimer);
    toast.hidden = false;
    toast.classList.remove('is-leaving');
    void toast.offsetWidth;
    toastAutoHideTimer = setTimeout(hideSuccessToast, 6000);
    document.addEventListener('keydown', onToastKeydown);
  }

  function hideSuccessToast() {
    if (!toast || toast.hidden) return;
    clearTimeout(toastAutoHideTimer);
    toast.classList.add('is-leaving');
    document.removeEventListener('keydown', onToastKeydown);
    setTimeout(function () {
      toast.hidden = true;
      toast.classList.remove('is-leaving');
    }, 300);
  }

  function onToastKeydown(e) {
    if (e.key === 'Escape') hideSuccessToast();
  }

  if (toastClose) toastClose.addEventListener('click', hideSuccessToast);
  if (toastOk) toastOk.addEventListener('click', hideSuccessToast);
})();
