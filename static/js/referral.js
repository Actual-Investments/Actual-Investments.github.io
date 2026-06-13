/* ===========================================================================
 *  Actual Investments — referral tracking + contact form + booking widget
 *
 *  What this does:
 *   1. Reads a referral code from the URL (?ref=CODE, or ?utm_campaign=CODE)
 *      and remembers it in the browser so it survives page navigation.
 *   2. Puts that code into the hidden field of the contact form, so every
 *      submission tells you who referred the lead.
 *   3. Appends the code to the Calendly booking link, so every booked call is
 *      attributed too (it shows up under UTM/Campaign in Calendly).
 *   4. Submits the contact form in the background so visitors stay on the page
 *      and see a friendly confirmation message.
 *
 *  Share a referral link like:
 *      https://Actual-Investments.github.io/?ref=PARTNER123
 * ======================================================================== */
(function () {
  "use strict";

  var STORAGE_KEY = "ai_referral_code";

  // --- 1. Work out the current referral code --------------------------------
  function getReferralCode() {
    var params = new URLSearchParams(window.location.search);
    var code =
      params.get("ref") ||
      params.get("referral") ||
      params.get("utm_campaign") ||
      "";
    code = code.trim();

    if (code) {
      try { window.localStorage.setItem(STORAGE_KEY, code); } catch (e) {}
      return code;
    }
    // No code in the URL — fall back to one we saw earlier this session.
    try { return window.localStorage.getItem(STORAGE_KEY) || ""; }
    catch (e) { return ""; }
  }

  var referralCode = getReferralCode();

  // --- 2. Put the code into the contact form's hidden field -----------------
  function wireReferralField() {
    var field = document.getElementById("referral-field");
    if (field) field.value = referralCode;
  }

  // --- 3. Submit the contact form via fetch (no page reload) -----------------
  function wireContactForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;
    var status = document.getElementById("form-status");

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (status) {
        status.textContent = "Sending…";
        status.className = "form-status";
      }

      var data = new FormData(form);
      data.set("referral_code", referralCode);

      fetch(form.action, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" }
      })
        .then(function (response) { return response.json(); })
        .then(function (result) {
          if (result.success) {
            form.reset();
            if (status) {
              status.textContent =
                "✓ Thanks — we’ve received your details and will be in touch shortly.";
              status.className = "form-status success";
            }
          } else {
            if (status) {
              status.textContent =
                (result.message || "Something went wrong.") +
                " Please email us instead.";
              status.className = "form-status error";
            }
          }
        })
        .catch(function () {
          if (status) {
            status.textContent =
              "Network error — please email us directly.";
            status.className = "form-status error";
          }
        });
    });
  }

  // --- 4. Load Calendly, with the referral code attached as UTM data --------
  function wireCalendly() {
    var widgets = document.querySelectorAll(".calendly-inline-widget");
    if (!widgets.length) return;

    widgets.forEach(function (widget) {
      var base = widget.getAttribute("data-calendly-url");
      if (!base) return;
      try {
        var url = new URL(base);
        if (referralCode) {
          url.searchParams.set("utm_source", "referral");
          url.searchParams.set("utm_campaign", referralCode);
        }
        widget.setAttribute("data-calendly-url", url.toString());
      } catch (e) { /* leave the base URL as-is */ }
    });

    // Inject Calendly's script only after the URLs above are finalised.
    if (!document.getElementById("calendly-widget-script")) {
      var script = document.createElement("script");
      script.id = "calendly-widget-script";
      script.src = "https://assets.calendly.com/assets/external/widget.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }

  function init() {
    wireReferralField();
    wireContactForm();
    wireCalendly();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
