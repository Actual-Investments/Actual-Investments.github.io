+++
title = "Testing Results"
description = "Backtest and forward-test results for the Actual Investments trading bot."
template = "page.html"

[extra]
use_toc = false
+++

<h1>Strategy-tester results</h1>

<p class="section-lead">
  <!-- EDIT ME -->
  Below are strategy-tester and live results for our flagship EURUSD bot. These
  are historical and hypothetical where noted, and do not guarantee future
  performance — see the disclaimer on the home page.
</p>

<!-- =======================================================================
     HOW TO ADD A RESULT IMAGE
     1. Put your PNG in  static/img/results/  (e.g. static/img/results/eurusd.png)
     2. Copy one result() line below and edit src / title / desc.
        - title and desc are optional (delete them if you don't want them).
     ======================================================================= -->

{{ result(src="/img/results/placeholder.svg", title="EURUSD — 7-year backtest", desc="Replace this placeholder: drop your PNG in static/img/results/ and update the src, title and description.") }}

{{ result(src="/img/results/placeholder.svg", title="Live / forward results", desc="A second example. Add as many result() blocks as you like.") }}

<p class="section-lead" style="margin-top:2rem">
  Want the raw numbers? See the live, independently-tracked account on the
  <a href="/#verification">Proof section</a> of the home page.
</p>
