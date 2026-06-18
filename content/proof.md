+++
title = "Proof"
description = "Live, independently-tracked performance and strategy-tester results for the Actual Algos bot."
template = "page.html"

[extra]
use_toc = false
+++

<h1>Proof, not promise</h1>

<p class="section-lead">
  Every trade is tracked publicly, and the bot runs on our own real money. Below
  is the live, independently-verified account plus the underlying strategy-tester
  results.
</p>

<div class="verify-grid verify-grid--single">
  <div class="verify-card">
    <h3>Myfxbook</h3>
    <p>Live, independently-tracked performance: growth, gain and drawdown.</p>
    <a class="cta-button cta-button--ghost" href="https://www.myfxbook.com/members/AnActualBanana/grid-scalping-v2-eurusd/12067479" target="_blank" rel="noopener">View the Myfxbook page for the bot</a>
    <!-- EDIT ME: replace the link above if your Myfxbook page changes. -->
  </div>
</div>

<h2 style="margin-top:2.5rem">Strategy-tester results</h2>

<p class="section-lead">These are <strong>hypothetical results from historical backtesting</strong>. Backtested results are prepared with hindsight, do not reflect real execution, slippage or fees, and frequently differ from actual trading. They do not guarantee future performance — see the full disclaimer on the home page.</p>

<!-- =======================================================================
     HOW TO ADD A RESULT IMAGE
     1. Put your PNG in  static/img/results/  (e.g. static/img/results/eurusd.png)
     2. Copy one result() line below and edit src / title / desc.
        title and desc are optional (delete them if you don't want them).
     ======================================================================= -->

{{ result(src="/img/results/Grid 2 EURUSD.jpg", title="EURUSD — 8-year backtest (hypothetical)", desc="Hypothetical backtest. Testing period Sep 01 2017 - May 31 2026. $25,000 starting balance, Moderate risk level (0.10) starting lot.") }}
