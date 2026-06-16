+++
title = "Proof"
description = "Live, independently-tracked performance and strategy-tester results for the Actual Investments bot."
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

<p class="section-lead">Backtest and forward-test results. These are historical and hypothetical where noted, and do not guarantee future performance — see the disclaimer on the home page.</p>

<!-- =======================================================================
     HOW TO ADD A RESULT IMAGE
     1. Put your PNG in  static/img/results/  (e.g. static/img/results/eurusd.png)
     2. Copy one result() line below and edit src / title / desc.
        title and desc are optional (delete them if you don't want them).
     ======================================================================= -->

{{ result(src="/img/results/placeholder.svg", title="EURUSD — 7-year backtest", desc="Replace this placeholder: drop your PNG in static/img/results/ and update the src, title and description.") }}

{{ result(src="/img/results/placeholder.svg", title="Live / forward results", desc="A second example. Add as many result() blocks as you like.") }}
