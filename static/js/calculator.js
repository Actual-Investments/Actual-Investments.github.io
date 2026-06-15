/* ===========================================================================
 *  Actual Investments — returns projection calculator
 *
 *  ▼▼▼  EDIT YOUR NUMBERS HERE  ▼▼▼
 *  Everything you'd normally want to change lives in the CONFIG object below.
 *  Save the file and the calculator updates automatically.
 * ======================================================================== */
var CONFIG = {

  // ---- Risk levels -------------------------------------------------------
  // lotPer25k     = starting lot size per $25,000 of account.
  // monthlyReturn = average monthly return for that risk level, as a percent.
  // illustrative  = true adds a "not reliably repeatable" warning (used for the
  //                 two most aggressive tiers, which are far above what was
  //                 drawdown-tested).
  riskLevels: [
    { name: "Conservative",          lotPer25k: 0.06, monthlyReturn: 1.70 },
    { name: "Conservative-Moderate", lotPer25k: 0.08, monthlyReturn: 2.31 },
    { name: "Moderate",              lotPer25k: 0.10, monthlyReturn: 2.89 },
    { name: "Moderate-Aggressive",   lotPer25k: 0.50, monthlyReturn: 14.45, illustrative: true },
    { name: "Aggressive",            lotPer25k: 0.80, monthlyReturn: 23.12, illustrative: true }
  ],
  defaultRisk: 2, // 0-based index; 2 = Moderate

  // ---- The 5ers High Stakes challenge tiers (prop-firm mode) -------------
  // size = funded account size, fee = cost of the challenge.
  propTiers: [
    { size: 2500,   fee: 29 },
    { size: 5000,   fee: 45 },
    { size: 10000,  fee: 79 },
    { size: 25000,  fee: 186 },
    { size: 50000,  fee: 288 },
    { size: 100000, fee: 501 }
  ],
  defaultPropTier: 3,     // index; 3 = $25,000
  propProfitSplit: 0.80,  // you keep 80% (rises toward 100% as you scale)

  // ---- Live / Bring-your-own modes --------------------------------------
  presets: [300, 500, 1000, 2500, 10000, 25000, 100000],
  defaultPreset: 3,       // index; 3 = $2,500
  sliderMin: 100,         // slider floor (use the input box for less)
  sliderMax: 5000000      // slider ceiling ($5M)
};
/* ▲▲▲  END OF EDITABLE SECTION — logic below  ▲▲▲ */


(function () {
  "use strict";

  var root = document.getElementById("calc");
  if (!root) return;

  // ---- Helpers -----------------------------------------------------------
  // Money formatting: plain under $1,000, "K" under $1M, "M" at $1M+.
  function money(n) {
    n = Math.round(n);
    if (Math.abs(n) >= 1000000) return "$" + trim(n / 1000000) + "M";
    if (Math.abs(n) >= 1000)    return "$" + trim(n / 1000) + "K";
    return "$" + n.toLocaleString("en-US");
  }
  function trim(x) {
    return (Math.round(x * 100) / 100).toString();
  }
  function pct(n) { return (Math.round(n * 100) / 100) + "%"; }
  function el(id) { return document.getElementById(id); }

  // Round a slider dollar value to something tidy for its magnitude.
  function roundNice(d) {
    if (d < 1000)    return Math.round(d / 10) * 10;
    if (d < 100000)  return Math.round(d / 100) * 100;
    if (d < 1000000) return Math.round(d / 1000) * 1000;
    return Math.round(d / 10000) * 10000;
  }
  // Logarithmic mapping between slider position (0..1000) and dollars.
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
    mode: "live",                       // "live" | "prop" | "byo"
    size: CONFIG.presets[CONFIG.defaultPreset],
    riskIndex: CONFIG.defaultRisk,
    propIndex: CONFIG.defaultPropTier
  };

  // ---- Build the controls ------------------------------------------------
  // Mode buttons
  var modes = [
    { id: "live", label: "Live brokerage" },
    { id: "prop", label: "Prop firm (The 5ers)" },
    { id: "byo",  label: "Bring your own account" }
  ];
  var modesWrap = el("calcModes");
  modes.forEach(function (m) {
    var b = chip(m.label, m.id === state.mode);
    b.addEventListener("click", function () {
      state.mode = m.id;
      setActive(modesWrap, b);
      syncModeUI();
      render();
    });
    modesWrap.appendChild(b);
  });

  // Preset size buttons (live / byo)
  var presetsWrap = el("calcPresets");
  CONFIG.presets.forEach(function (amount, i) {
    var b = chip(money(amount), i === CONFIG.defaultPreset);
    b.addEventListener("click", function () {
      state.size = amount;
      setActive(presetsWrap, b);
      syncSizeInputs();
      render();
    });
    presetsWrap.appendChild(b);
  });

  // Prop tier buttons
  var propWrap = el("calcPropTiers");
  CONFIG.propTiers.forEach(function (t, i) {
    var b = chip(money(t.size) + " · " + money(t.fee), i === CONFIG.defaultPropTier);
    b.addEventListener("click", function () {
      state.propIndex = i;
      setActive(propWrap, b);
      render();
    });
    propWrap.appendChild(b);
  });

  // Risk buttons
  var riskWrap = el("calcRisk");
  CONFIG.riskLevels.forEach(function (r, i) {
    var b = chip(r.name, i === CONFIG.defaultRisk);
    b.addEventListener("click", function () {
      state.riskIndex = i;
      setActive(riskWrap, b);
      render();
    });
    riskWrap.appendChild(b);
  });

  // Slider + input (live / byo)
  var slider = el("calcSlider");
  var input = el("calcInput");
  slider.min = 0; slider.max = 1000; slider.step = 1;
  slider.value = dollarsToPos(state.size);
  slider.addEventListener("input", function () {
    state.size = posToDollars(parseInt(slider.value, 10));
    clearActive(presetsWrap);
    input.value = state.size;
    render();
  });
  input.addEventListener("input", function () {
    var v = parseFloat(input.value);
    if (isNaN(v) || v < 0) return;
    state.size = v;
    clearActive(presetsWrap);
    slider.value = dollarsToPos(v);
    render();
  });

  function chip(label, active) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "roi-chip" + (active ? " is-active" : "");
    b.textContent = label;
    return b;
  }
  function setActive(container, btn) {
    clearActive(container);
    btn.classList.add("is-active");
  }
  function clearActive(container) {
    container.querySelectorAll(".roi-chip").forEach(function (e) {
      e.classList.remove("is-active");
    });
  }
  function syncSizeInputs() {
    input.value = state.size;
    slider.value = dollarsToPos(state.size);
  }
  function syncModeUI() {
    var isProp = state.mode === "prop";
    el("calcSizeWrap").style.display = isProp ? "none" : "";
    el("calcPropWrap").style.display = isProp ? "" : "none";
    el("calcPropDisclaimer").style.display = isProp ? "" : "none";
  }

  // ---- Warnings ----------------------------------------------------------
  function buildWarnings(size, totalLots, risk) {
    var w = [];

    // Small-account risk (not relevant to prop, where size is the funded amount)
    if (state.mode !== "prop") {
      if (size < 300) {
        w.push(["severe", "At under $300, there is a high risk of losing your entire account. The strategy's tested drawdown alone can exceed a balance this small."]);
      } else if (size < 500) {
        w.push(["mild", "Between $300 and $500, there is a mild risk of losing your entire account. $500+ with conservative lot scaling is safer."]);
      }
    }

    // Liquidity — triggered by account size OR by stacked lots (starting lot × 6)
    var liqSevere = size > 750000 || totalLots >= 30;
    var liqMild = size > 250000 || totalLots >= 10;
    if (liqSevere) {
      w.push(["severe", "High likelihood of liquidity issues and slippage at this size and risk level (≈ " + trim(totalLots) + " lots of potential exposure). Live results become unreliable."]);
    } else if (liqMild) {
      w.push(["mild", "Possible liquidity issues at this size and risk level (≈ " + trim(totalLots) + " lots of potential exposure)."]);
    }

    // Prop-rule risk at Moderate or higher
    if (state.mode === "prop" && state.riskIndex >= 2) {
      var sev = state.riskIndex >= 3 ? "severe" : "mild";
      w.push([sev, "At " + risk.name + " risk, the strategy's equity drawdown can breach a prop firm's loss limits. The 5ers allows only 5% daily and 10% overall — a single breach fails the account."]);
    }

    // Illustrative (over-extrapolated) tiers
    if (risk.illustrative) {
      w.push(["mild", risk.name + " returns are illustrative extrapolations far above the drawdown-tested range — they are not reliably repeatable and carry a high risk of large losses."]);
    }

    return w;
  }

  function renderWarnings(list) {
    var box = el("calcWarnings");
    box.innerHTML = "";
    list.forEach(function (item) {
      var d = document.createElement("div");
      d.className = "calc-warn calc-warn--" + item[0];
      d.innerHTML = '<span class="calc-warn__icon">' +
        (item[0] === "severe" ? "🛑" : "⚠️") + "</span><span>" + item[1] + "</span>";
      box.appendChild(d);
    });
  }

  // ---- Render ------------------------------------------------------------
  function statRow(label, value, mod) {
    return '<div class="calc__row' + (mod ? " " + mod : "") +
      '"><span>' + label + '</span><span class="calc__val">' + value + "</span></div>";
  }

  function render() {
    var risk = CONFIG.riskLevels[state.riskIndex];
    var r = risk.monthlyReturn / 100;
    var size = state.mode === "prop" ? CONFIG.propTiers[state.propIndex].size : state.size;
    var startingLot = risk.lotPer25k * size / 25000;
    var totalLots = startingLot * 6;
    // Brokers enforce a 0.01 minimum lot, so never display less than that.
    var displayLot = Math.max(0.01, startingLot);
    var grossMonthly = size * r;

    var html = "";
    if (state.mode === "prop") {
      var fee = CONFIG.propTiers[state.propIndex].fee;
      var yourShare = grossMonthly * CONFIG.propProfitSplit;
      var roiVsFee = yourShare / fee * 100;
      html += statRow("Challenge fee (one-time)", money(fee));
      html += statRow("Funded account size", money(size));
      html += statRow("Starting lot size", trim(displayLot) + " lots");
      html += statRow("Monthly return on strategy", '<span class="return-figure">' + pct(risk.monthlyReturn) + "</span>", "calc__row--divider");
      html += statRow("Gross monthly profit", money(grossMonthly));
      html += statRow("Your share (80% split)", '<span class="return-figure">' + money(yourShare) + "</span>");
      html += statRow("Monthly ROI vs challenge fee", '<span class="return-figure">' + pct(roiVsFee) + "</span>");
    } else {
      var twelve = size * Math.pow(1 + r, 12);
      html += statRow("Account size", money(size));
      html += statRow("Starting lot size", trim(displayLot) + " lots");
      html += statRow("Monthly return on strategy", '<span class="return-figure">' + pct(risk.monthlyReturn) + "</span>", "calc__row--divider");
      html += statRow("Estimated monthly profit", '<span class="return-figure">' + money(grossMonthly) + "</span>");
      html += statRow("Projected balance after 12 months", money(twelve));
    }
    el("calcResults").innerHTML = html;

    renderWarnings(buildWarnings(size, totalLots, risk));
  }

  syncModeUI();
  syncSizeInputs();
  render();
})();
