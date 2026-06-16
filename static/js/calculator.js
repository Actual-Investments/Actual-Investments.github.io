/* ===========================================================================
 *  Actual Investments — returns projection calculator
 *
 *  ▼▼▼  EDIT YOUR NUMBERS HERE  ▼▼▼
 *  Everything you'd normally want to change lives in the CONFIG object below.
 *  Save the file and the calculator updates automatically.
 * ======================================================================== */
var CONFIG = {

  // ---- The strategy "basis" ---------------------------------------------
  // Everything is calibrated from one verified data point: the bot makes
  // baseReturn% per month when running baseLot lots per baseAccount dollars.
  // Returns, drawdowns and risk-of-ruin all scale from this.
  baseReturn: 2.89,     // average monthly return, %
  baseLot: 0.10,        // lots ...
  baseAccount: 25000,   // ... per this much account ($)

  // Backtest stats at the basis above. Drawdowns and the $ expected payoff
  // scale with the chosen risk level; profit factor and Sharpe are ratios and
  // stay fixed.
  stats: {
    profitFactor: 3.01,
    sharpe: 1.75,
    expectedPayoff: 36.97,   // $ per trade at baseLot
    maxBalanceDD: 2.21,      // %
    relBalanceDD: 2.36,      // %
    maxEquityDD: 6.05,       // %
    relEquityDD: 8.14        // %
  },

  // ---- Risk levels -------------------------------------------------------
  // lotPer25k    = starting lot per $25,000. illustrative = true adds a
  // "not reliably repeatable" warning for the most aggressive tiers.
  riskLevels: [
    { name: "Conservative",          lotPer25k: 0.06 },
    { name: "Conservative-Moderate", lotPer25k: 0.08 },
    { name: "Moderate",              lotPer25k: 0.10 },
    { name: "Moderate-Aggressive",   lotPer25k: 0.50, illustrative: true },
    { name: "Aggressive",            lotPer25k: 0.80, illustrative: true }
  ],
  defaultRisk: 2, // 0-based index; 2 = Moderate

  minLot: 0.01,   // broker minimum lot — returns scale UP below this floor

  // ---- The 5ers High Stakes challenge tiers (prop-firm mode) -------------
  propTiers: [
    { size: 2500,   fee: 29 },
    { size: 5000,   fee: 45 },
    { size: 10000,  fee: 79 },
    { size: 25000,  fee: 186 },
    { size: 50000,  fee: 288 },
    { size: 100000, fee: 501 }
  ],
  defaultPropTier: 3,        // index; 3 = $25,000
  propProfitSplit: 0.80,     // you keep 80% (rises toward 100% as you scale)
  propRoRAtModerate: 10,     // risk of ruin (%) at the Moderate basis; scales by lot
  propPhase1Target: 10,      // 5ers High Stakes phase-1 profit target, %
  propPhase2Target: 5,       // phase-2 target, %
  propMinTradingDays: 3,     // minimum trading days per phase

  // ---- Live / Bring-your-own modes --------------------------------------
  presets: [300, 500, 1000, 2500, 10000, 25000, 100000],
  defaultPreset: 3,          // index; 3 = $2,500
  sliderMin: 100,
  sliderMax: 5000000
};
/* ▲▲▲  END OF EDITABLE SECTION — logic below  ▲▲▲ */


(function () {
  "use strict";

  var root = document.getElementById("calc");
  if (!root) return;

  var TRADING_DAYS_PER_MONTH = 21.74;

  // ---- Formatting --------------------------------------------------------
  function money(n) {
    n = Math.round(n);
    if (Math.abs(n) >= 1000000) return "$" + trim(n / 1000000) + "M";
    if (Math.abs(n) >= 1000)    return "$" + trim(n / 1000) + "K";
    return "$" + n.toLocaleString("en-US");
  }
  function trim(x) { return (Math.round(x * 100) / 100).toString(); }
  function pct(n) { return (Math.round(n * 100) / 100) + "%"; }
  function ddPct(n) { return n >= 100 ? "100%+ (total loss)" : pct(n); }
  function el(id) { return document.getElementById(id); }

  function roundNice(d) {
    if (d < 1000)    return Math.round(d / 10) * 10;
    if (d < 100000)  return Math.round(d / 100) * 100;
    if (d < 1000000) return Math.round(d / 1000) * 1000;
    return Math.round(d / 10000) * 10000;
  }
  function posToDollars(pos) {
    var r = Math.log(CONFIG.sliderMax / CONFIG.sliderMin);
    return roundNice(CONFIG.sliderMin * Math.exp(r * pos / 1000));
  }
  function dollarsToPos(d) {
    d = Math.max(CONFIG.sliderMin, Math.min(CONFIG.sliderMax, d));
    var r = Math.log(CONFIG.sliderMax / CONFIG.sliderMin);
    return Math.round(1000 * Math.log(d / CONFIG.sliderMin) / r);
  }

  // ---- State -------------------------------------------------------------
  var state = {
    mode: "live",
    size: CONFIG.presets[CONFIG.defaultPreset],
    riskIndex: CONFIG.defaultRisk,
    propIndex: CONFIG.defaultPropTier,
    detailsOpen: false
  };

  // ---- Controls ----------------------------------------------------------
  var modes = [
    { id: "live", label: "Live brokerage" },
    { id: "prop", label: "Prop firm (The 5ers)" },
    { id: "byo",  label: "Bring your own account" }
  ];
  var modesWrap = el("calcModes");
  modes.forEach(function (m) {
    var b = chip(m.label, m.id === state.mode);
    b.addEventListener("click", function () {
      state.mode = m.id; setActive(modesWrap, b); syncModeUI(); render();
    });
    modesWrap.appendChild(b);
  });

  var presetsWrap = el("calcPresets");
  CONFIG.presets.forEach(function (amount, i) {
    var b = chip(money(amount), i === CONFIG.defaultPreset);
    b.addEventListener("click", function () {
      state.size = amount; setActive(presetsWrap, b); syncSizeInputs(); render();
    });
    presetsWrap.appendChild(b);
  });

  var propWrap = el("calcPropTiers");
  CONFIG.propTiers.forEach(function (t, i) {
    var b = chip(money(t.size) + " · " + money(t.fee), i === CONFIG.defaultPropTier);
    b.addEventListener("click", function () {
      state.propIndex = i; setActive(propWrap, b); render();
    });
    propWrap.appendChild(b);
  });

  var riskWrap = el("calcRisk");
  CONFIG.riskLevels.forEach(function (r, i) {
    var b = chip(r.name, i === CONFIG.defaultRisk);
    b.addEventListener("click", function () {
      state.riskIndex = i; setActive(riskWrap, b); render();
    });
    riskWrap.appendChild(b);
  });

  var slider = el("calcSlider");
  var input = el("calcInput");
  slider.min = 0; slider.max = 1000; slider.step = 1;
  slider.value = dollarsToPos(state.size);
  slider.addEventListener("input", function () {
    state.size = posToDollars(parseInt(slider.value, 10));
    clearActive(presetsWrap); input.value = state.size; render();
  });
  input.addEventListener("input", function () {
    var v = parseFloat(input.value);
    if (isNaN(v) || v < 0) return;
    state.size = v; clearActive(presetsWrap); slider.value = dollarsToPos(v); render();
  });

  var moreBtn = el("calcMoreBtn");
  moreBtn.addEventListener("click", function () {
    state.detailsOpen = !state.detailsOpen;
    syncDetails();
  });

  function chip(label, active) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "roi-chip" + (active ? " is-active" : "");
    b.textContent = label;
    return b;
  }
  function setActive(c, btn) { clearActive(c); btn.classList.add("is-active"); }
  function clearActive(c) {
    c.querySelectorAll(".roi-chip").forEach(function (e) { e.classList.remove("is-active"); });
  }
  function syncSizeInputs() { input.value = state.size; slider.value = dollarsToPos(state.size); }
  function syncModeUI() {
    var isProp = state.mode === "prop";
    el("calcSizeWrap").style.display = isProp ? "none" : "";
    el("calcPropWrap").style.display = isProp ? "" : "none";
    el("calcPropDisclaimer").style.display = isProp ? "" : "none";
  }
  function syncDetails() {
    el("calcDetails").hidden = !state.detailsOpen;
    moreBtn.setAttribute("aria-expanded", state.detailsOpen ? "true" : "false");
    moreBtn.textContent = state.detailsOpen ? "Fewer details ▲" : "More details ▼";
  }

  // ---- Core maths --------------------------------------------------------
  // Everything scales from the basis. scaleFactor = 1 at the Moderate basis
  // (0.10 lot / $25k); it rises for higher risk and for small accounts where
  // the lot is floored at the 0.01 broker minimum.
  function model(size, risk) {
    var rawLot = risk.lotPer25k * size / 25000;
    var actualLot = Math.max(CONFIG.minLot, rawLot);
    var scaleFactor = actualLot * 25000 / (CONFIG.baseLot * size); // (lot/size) ÷ (baseLot/baseAccount)
    var monthlyReturn = CONFIG.baseReturn * scaleFactor;           // %
    return {
      actualLot: actualLot,
      floored: rawLot < CONFIG.minLot,
      scaleFactor: scaleFactor,
      monthlyReturn: monthlyReturn,
      totalLots: actualLot * 6
    };
  }

  // Non-prop risk of ruin, from "dollars backing each 0.01 lot".
  function nonPropRoR(size, actualLot) {
    var D = size * CONFIG.minLot / actualLot;
    if (D >= 500) return "&lt; 1%";
    if (D >= 400) return "~1%";
    if (D >= 300) return "~" + Math.round(1 + (400 - D) / 100 * 9) + "%";
    return "&gt; 10% (very high)";
  }

  // ---- Warnings ----------------------------------------------------------
  function buildWarnings(size, m, risk) {
    var w = [];
    if (state.mode !== "prop") {
      if (size < 300) w.push(["severe", "At under $300, there is a high risk of losing your entire account. The strategy's tested drawdown alone can exceed a balance this small."]);
      else if (size < 500) w.push(["mild", "Between $300 and $500, there is a mild risk of losing your entire account. $500+ with conservative lot scaling is safer."]);
    }
    var liqSevere = size > 750000 || m.totalLots >= 30;
    var liqMild = size > 250000 || m.totalLots >= 10;
    if (liqSevere) w.push(["severe", "High likelihood of liquidity issues and slippage at this size and risk level (≈ " + trim(m.totalLots) + " lots of potential exposure). Live results become unreliable."]);
    else if (liqMild) w.push(["mild", "Possible liquidity issues at this size and risk level (≈ " + trim(m.totalLots) + " lots of potential exposure)."]);
    if (state.mode === "prop" && state.riskIndex >= 2) {
      var sev = state.riskIndex >= 3 ? "severe" : "mild";
      w.push([sev, "At " + risk.name + " risk, the strategy's equity drawdown can breach a prop firm's loss limits. The 5ers allows only 5% daily and 10% overall — a single breach fails the account."]);
    }
    if (risk.illustrative) w.push(["mild", risk.name + " returns are illustrative extrapolations far above the drawdown-tested range — they are not reliably repeatable and carry a high risk of large losses."]);
    return w;
  }
  function renderWarnings(list) {
    var box = el("calcWarnings");
    box.innerHTML = "";
    list.forEach(function (item) {
      var d = document.createElement("div");
      d.className = "calc-warn calc-warn--" + item[0];
      d.innerHTML = '<span class="calc-warn__icon">' + (item[0] === "severe" ? "🛑" : "⚠️") + "</span><span>" + item[1] + "</span>";
      box.appendChild(d);
    });
  }

  // ---- Row builders ------------------------------------------------------
  function row(label, value, mod) {
    return '<div class="calc__row' + (mod ? " " + mod : "") + '"><span>' + label + '</span><span class="calc__val">' + value + "</span></div>";
  }
  function rf(v) { return '<span class="return-figure">' + v + "</span>"; }
  function subhead(t) { return '<p class="calc__subhead">' + t + "</p>"; }

  function drawdownRows(m) {
    var s = CONFIG.stats, f = m.scaleFactor;
    return subhead("Drawdown (scales with risk level)") +
      row("Max balance drawdown", ddPct(s.maxBalanceDD * f)) +
      row("Relative balance drawdown", ddPct(s.relBalanceDD * f)) +
      row("Max equity drawdown", ddPct(s.maxEquityDD * f)) +
      row("Relative equity drawdown", ddPct(s.relEquityDD * f));
  }
  function statRows(m) {
    var s = CONFIG.stats;
    return subhead("Strategy stats") +
      row("Profit factor", trim(s.profitFactor)) +
      row("Sharpe ratio", trim(s.sharpe)) +
      row("Expected payoff / trade", money(s.expectedPayoff * m.actualLot / CONFIG.baseLot));
  }

  // ---- Render ------------------------------------------------------------
  function render() {
    var risk = CONFIG.riskLevels[state.riskIndex];
    var size = state.mode === "prop" ? CONFIG.propTiers[state.propIndex].size : state.size;
    var m = model(size, risk);
    var r = m.monthlyReturn / 100;

    var main = "", details = "";

    if (state.mode === "prop") {
      var fee = CONFIG.propTiers[state.propIndex].fee;
      var gross = size * r;                       // non-compounding
      var share = gross * CONFIG.propProfitSplit;
      var roiVsFee = share / fee * 100;
      main += row("Challenge fee (one-time)", money(fee));
      main += row("Funded account size", money(size));
      main += row("Monthly return on strategy", rf(pct(m.monthlyReturn)), "calc__row--divider");
      main += row("Gross monthly profit", money(gross));
      main += row("Your share (80% split)", rf(money(share)));
      main += row("Monthly ROI vs challenge fee", rf(pct(roiVsFee)));

      // Details
      details += row("Starting lot size", trim(m.actualLot) + " lots");
      details += drawdownRows(m);
      details += subhead("Risk");
      details += row("Risk of ruin (fail the account)", ddPct(Math.min(99, CONFIG.propRoRAtModerate * m.scaleFactor)));
      var t = timeToPass(r);
      details += row("Est. time to pass (2 phases)", t);
      details += subhead("Profit (non-compounding)");
      details += row("Your 12-month profit", money(share * 12));
      details += statRows(m);
    } else {
      var monthly = size * r;
      var compounded = size * Math.pow(1 + r, 12);
      main += row("Account size", money(size));
      main += row("Monthly return on strategy", rf(pct(m.monthlyReturn)), "calc__row--divider");
      main += row("Estimated monthly profit", rf(money(monthly)));
      main += row("Projected balance — 12 mo (compounding)", money(compounded));

      // Details
      details += row("Starting lot size", trim(m.actualLot) + " lots" + (m.floored ? " (0.01 min)" : ""));
      details += drawdownRows(m);
      details += subhead("Risk");
      details += row("Risk of ruin", nonPropRoR(size, m.actualLot));
      details += subhead("12-month profit");
      details += row("Simple (fixed lot)", money(monthly * 12));
      details += row("Compounding (lot scales up)", money(compounded - size));
      details += statRows(m);
    }

    el("calcResults").innerHTML = main;
    el("calcDetails").innerHTML = details;
    renderWarnings(buildWarnings(size, m, risk));
  }

  // Estimated time to pass the two-phase challenge (non-compounding).
  function timeToPass(r) {
    var floor = CONFIG.propMinTradingDays / TRADING_DAYS_PER_MONTH;
    var p1 = Math.max(floor, (CONFIG.propPhase1Target / 100) / r);
    var p2 = Math.max(floor, (CONFIG.propPhase2Target / 100) / r);
    var months = p1 + p2;
    if (months < 1) return "≈ " + Math.round(months * 4.345) + " weeks";
    return "≈ " + (Math.round(months * 10) / 10) + " months";
  }

  syncModeUI();
  syncSizeInputs();
  syncDetails();
  render();
})();
