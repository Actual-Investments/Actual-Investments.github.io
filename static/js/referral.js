/* ===========================================================================
 *  Actual Algos — referral tracking + forms + booking widget
 *
 *  What this does:
 *   1. Reads a referral code from the URL (?ref=CODE, or ?utm_campaign=CODE)
 *      and remembers it in the browser so it survives page navigation.
 *   2. Puts that code into the "referral_code" field of any form, so every
 *      submission tells you who referred the lead.
 *   3. Appends the code to the Calendly booking link, so booked calls are
 *      attributed too (shows up under UTM/Campaign in Calendly).
 *   4. Submits any form with class "js-form" in the background, so visitors
 *      stay on the page and see a friendly confirmation message.
 *
 *  Share a referral link like:
 *      https://Actual-Investments.github.io/?ref=PARTNER123
 * ======================================================================== */
(function () {
  "use strict";

  var STORAGE_KEY = "ai_referral_code";

  // True when the code came from THIS page's URL (?ref=…), so we lock the field.
  var referralFromUrl = false;

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
      referralFromUrl = true;
      try { window.localStorage.setItem(STORAGE_KEY, code); } catch (e) {}
      return code;
    }
    // No code in the URL — fall back to one we saw earlier this session.
    try { return window.localStorage.getItem(STORAGE_KEY) || ""; }
    catch (e) { return ""; }
  }

  var referralCode = getReferralCode();

  // --- 2. Pre-fill any visible "referral code" field ------------------------
  function wireReferralField() {
    if (!referralCode) return;
    var field = document.getElementById("referral-field");
    if (!field) return;
    field.value = referralCode;
    // If the visitor arrived via a referral link, lock the code so it can't
    // be changed or overwritten — the referral is credited to that partner.
    if (referralFromUrl) {
      field.readOnly = true;
      field.classList.add("is-locked");
      field.setAttribute("title", "Referral code applied from your link");
    }
  }

  // --- 3. Submit every form with class "js-form" via fetch (no reload) -------
  function wireForms() {
    var forms = document.querySelectorAll("form.js-form");
    Array.prototype.forEach.call(forms, function (form) {
      var status = form.querySelector(".form-status");

      form.addEventListener("submit", function (event) {
        event.preventDefault();
        if (status) {
          status.textContent = "Sending…";
          status.className = "form-status";
        }

        var data = new FormData(form);
        if (referralCode && form.querySelector('[name="referral_code"]')) {
          data.set("referral_code", referralCode);
        }

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
            } else if (status) {
              status.textContent =
                (result.message || "Something went wrong.") +
                " Please email us instead.";
              status.className = "form-status error";
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
    });
  }

  // --- 4. Attach the referral code to the Calendly booking link -------------
  function wireCalendly() {
    if (!referralCode) return; // nothing to attribute; let Calendly load normally
    var widgets = document.querySelectorAll(".calendly-inline-widget");
    Array.prototype.forEach.call(widgets, function (widget) {
      var attr = widget.hasAttribute("data-url") ? "data-url" : "data-calendly-url";
      var base = widget.getAttribute(attr);
      if (!base) return;
      try {
        var url = new URL(base);
        url.searchParams.set("utm_source", "referral");
        url.searchParams.set("utm_campaign", referralCode);
        widget.setAttribute(attr, url.toString());
      } catch (e) { /* leave the base URL as-is */ }
    });
  }

  function init() {
    wireReferralField();
    wireForms();
    wireCalendly();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
