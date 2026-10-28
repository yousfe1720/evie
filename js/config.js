/* =========================================================
   CAL — site configuration
   Everything you are expected to edit lives here.
========================================================= */
window.CAL_CONFIG = {
  /* WAITLIST: POSTs {email, use, consent, source, form} (form-encoded) to the Google Apps Script
     web app that writes into the same Google Sheet used by the evie project.
     Leave empty until a real backend exists. While empty, the form will
     say clearly that registration is not connected — it never fakes success. */
  WAITLIST_ENDPOINT: "https://script.google.com/macros/s/AKfycbzCyCs2UXGJARO1bCbz1tz_Msrb11f4mebto39H3LPj-aLeT8HCGmUmVqc4pwfUTmVV/exec",

  /* CONTACT / SALES: POST {name, email, company, topic, message, source}.
     Leave empty until connected. */
  CONTACT_ENDPOINT: "https://script.google.com/macros/s/AKfycbzCyCs2UXGJARO1bCbz1tz_Msrb11f4mebto39H3LPj-aLeT8HCGmUmVqc4pwfUTmVV/exec",

  /* Optional direct inbox shown on the contact page as a fallback link.
     Leave empty to hide it. Example: "sales@your-domain.com" */
  SALES_EMAIL: "",

  /* "Deploy CAL to your system" button (final scroll slide). Point this at the real installer / setup page when it exists. */
  DEPLOY_URL: "waitlist/index.html",

  /* OFFICIAL VIDEO — swap these paths to replace the video without touching the layout.
     (The supplied file currently carries evie branding — replace with the CAL film when ready.) */
  MEDIA: {
    video: "assets/video/cal-hero.mp4",
    poster: "assets/video/poster.jpg",
    captions: "assets/captions/cal-video.en.vtt",
    title: "CAL — product film"
  }
};
