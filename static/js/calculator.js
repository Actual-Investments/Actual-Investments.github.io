/* ===========================================================================
 *  Actual Investments — leverage projection calculator
 *
 *  ▼▼▼  EDIT YOUR NUMBERS HERE  ▼▼▼
 *  Everything you'd normally want to change lives in the CONFIG object below.
 *  After editing, just save — the projection updates automatically.
 * ======================================================================== */
var CONFIG = {

  // Average MONTHLY return of the flagship bot, as a percent.
  monthlyReturn: 2.89,

  // Leverage provided by the liquidity provider (e.g. 10 = 10×).
  leverage: 10,

  // Deposit amounts shown as preset buttons. The slider spans the
  // smallest to the largest of these.
  deposits: [250, 400, 700, 1600, 3000, 5000, 8500, 15000, 30000],

  // Which preset is selected when the page loads (index into the list above).
  defaultDeposit: 3
};
/* ▲▲▲  END OF EDITABLE SECTION — logic below  ▲▲▲ */


(function () {
  "use strict";

  var root = document.getElementById("calc");
  if (!root) return;

  var money = new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0
  });
  var pct = function (n) { return (Math.round(n * 100) / 100) + "%"; };

  var deposit = CONFIG.deposits[CONFIG.defaultDeposit] || CONFIG.deposits[0];

  var slider = document.getElementById("calcSlider");
  var presetsWrap = document.getElementById("calcPresets");

  // Configure the slider range from the preset list.
  slider.min = Math.min.apply(null, CONFIG.deposits);
  slider.max = Math.max.apply(null, CONFIG.deposits);
  slider.step = 1000;
  slider.value = deposit;

  // Build the preset buttons.
  CONFIG.deposits.forEach(function (amount, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "roi-chip" + (i === CONFIG.defaultDeposit ? " is-active" : "");
    b.textContent = "$" + (amount / 1000) + "K";
    b.addEventListener("click", function () {
      deposit = amount;
      slider.value = amount;
      markActive(amount);
      render();
    });
    presetsWrap.appendChild(b);
  });

  slider.addEventListener("input", function () {
    deposit = parseInt(slider.value, 10);
    markActive(deposit);
    render();
  });

  function markActive(amount) {
    var btns = presetsWrap.querySelectorAll(".roi-chip");
    CONFIG.deposits.forEach(function (a, i) {
      btns[i].classList.toggle("is-active", a === amount);
    });
  }

  // Set every element with a given class to the same text.
  function setAll(cls, value) {
    var els = root.querySelectorAll("." + cls);
    Array.prototype.forEach.call(els, function (el) { el.textContent = value; });
  }

  function render() {
    var exposure = deposit * CONFIG.leverage;
    var profit = exposure * (CONFIG.monthlyReturn / 100);
    var roi = profit / deposit * 100; // == leverage × monthlyReturn

    setAll("js-deposit", money.format(deposit));
    setAll("js-exposure", money.format(exposure));
    setAll("js-leverage", "×" + CONFIG.leverage);
    setAll("js-return", pct(CONFIG.monthlyReturn));
    setAll("js-profit", money.format(profit));
    setAll("js-roi", pct(roi));
  }

  render();
})();
