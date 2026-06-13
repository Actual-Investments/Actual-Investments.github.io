/* ===========================================================================
 *  Actual Investments — ROI / drawdown projection calculator
 *
 *  ▼▼▼  EDIT YOUR NUMBERS HERE  ▼▼▼
 *  Everything you'd normally want to change lives in the CONFIG object below.
 *  After editing, just save — the calculator updates automatically.
 * ======================================================================== */
var CONFIG = {

  // ---- Your bots / strategies -------------------------------------------
  // monthlyReturn = average monthly return of the bot, as a percent.
  // maxDrawdown   = the strategy's worst peak-to-trough drop, as a percent.
  // The first bot in the list is selected by default.
  bots: [
    { name: "Conservative", monthlyReturn: 3.0, maxDrawdown: 8 },
    { name: "Balanced",     monthlyReturn: 4.5, maxDrawdown: 12 },
    { name: "Aggressive",   monthlyReturn: 6.0, maxDrawdown: 18 }
  ],

  // ---- iFunds funded accounts -------------------------------------------
  // Each option pairs the account SIZE you trade with the COST you pay for it.
  // Put real iFunds account sizes and prices here. The "effective leverage"
  // shown to visitors is simply size ÷ cost.
  accounts: [
    { label: "$25K account",  size: 25000,  cost: 199 },
    { label: "$50K account",  size: 50000,  cost: 349 },
    { label: "$100K account", size: 100000, cost: 599 },
    { label: "$200K account", size: 200000, cost: 999 }
  ],
  // Default selected account (index into the list above).
  defaultAccount: 2,

  // Share of profits you keep. iFunds pays out up to 80% (0.80).
  // Set to 1 to ignore the split entirely.
  profitSplit: 0.80,

  // Trading leverage iFunds advertises (shown as descriptive text only).
  iFundsLeverageText: "up to 1:100",

  // ---- Slider (monthly return %) ----------------------------------------
  slider: { min: 0, max: 10, step: 0.1 }
};
/* ▲▲▲  END OF EDITABLE SECTION — logic below  ▲▲▲ */


(function () {
  "use strict";

  var root = document.getElementById("roiCalc");
  if (!root) return;

  var state = {
    accountIndex: CONFIG.defaultAccount || 0,
    monthlyReturn: (CONFIG.bots[0] && CONFIG.bots[0].monthlyReturn) || 3,
    drawdownPct: (CONFIG.bots[0] && CONFIG.bots[0].maxDrawdown) || 10
  };

  var money = new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0
  });
  var pct = function (n) { return (Math.round(n * 10) / 10) + "%"; };

  // Build the bot-selector buttons
  var botsWrap = document.getElementById("roiBots");
  CONFIG.bots.forEach(function (bot, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "roi-chip" + (i === 0 ? " is-active" : "");
    b.textContent = bot.name;
    b.addEventListener("click", function () {
      setActive(botsWrap, b);
      state.monthlyReturn = bot.monthlyReturn;
      state.drawdownPct = bot.maxDrawdown;
      slider.value = bot.monthlyReturn;
      render();
    });
    botsWrap.appendChild(b);
  });

  // Build the account-selector buttons
  var accWrap = document.getElementById("roiAccounts");
  CONFIG.accounts.forEach(function (acc, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "roi-chip" + (i === state.accountIndex ? " is-active" : "");
    b.textContent = acc.label;
    b.addEventListener("click", function () {
      setActive(accWrap, b);
      state.accountIndex = i;
      render();
    });
    accWrap.appendChild(b);
  });

  // Wire the slider
  var slider = document.getElementById("roiSlider");
  slider.min = CONFIG.slider.min;
  slider.max = CONFIG.slider.max;
  slider.step = CONFIG.slider.step;
  slider.value = state.monthlyReturn;
  slider.addEventListener("input", function () {
    state.monthlyReturn = parseFloat(slider.value);
    render();
  });

  function setActive(container, btn) {
    container.querySelectorAll(".roi-chip").forEach(function (el) {
      el.classList.remove("is-active");
    });
    btn.classList.add("is-active");
  }

  function set(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function render() {
    var acc = CONFIG.accounts[state.accountIndex];
    var r = state.monthlyReturn / 100;
    var leverage = acc.size / acc.cost;

    var gross = acc.size * r;
    var net = gross * CONFIG.profitSplit;
    var roiOnCost = net / acc.cost * 100;
    var annual = net * 12;

    set("roiLeverage", "×" + Math.round(leverage));
    set("roiExposure", money.format(acc.size));
    set("roiRoiLabel", pct(state.monthlyReturn));
    set("roiGross", money.format(gross));
    set("roiNet", money.format(net));
    set("roiRoi", pct(roiOnCost));
    set("roiAnnual", money.format(annual));
    set("roiCost", money.format(acc.cost));
    set("roiDrawdown", "−" + money.format(acc.cost));
    set("roiStratDd", pct(state.drawdownPct));
  }

  render();
})();
