<script setup lang="ts">
// Demonstrates: group-level Route.withoutMiddleware(log). This route lives in
// the protected MainLayout group (so `auth` still runs) but opts OUT of the
// `log` middleware — so visiting it does NOT add an entry to the nav log.
import { navLog } from '../data/nav-log'
</script>

<template>
  <h1>Status <span class="muted">— withoutMiddleware(log)</span></h1>
  <div class="card">
    <p>
      Registered inside the protected group but wrapped in
      <code>Route.withoutMiddleware(log).group(…)</code>. The <code>auth</code> middleware still ran
      (you're logged in), but <code>log</code> was skipped — notice this navigation is
      <b>absent</b> from the navigation log in the sidebar.
    </p>
    <p>
      Current nav-log length: <b>{{ navLog.length }}</b> (unchanged by visiting this page).
    </p>
  </div>
</template>
