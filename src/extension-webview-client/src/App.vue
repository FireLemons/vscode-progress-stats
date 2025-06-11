<script setup lang="ts">
  import Errors from './components/Errors.vue'
  import Stats from './components/Stats.vue'
  import { ref } from 'vue'

  const initialState = window.__INITIAL_STATE__

  const dailyCommitCount = ref(initialState.stats.dailyCommitCount)
  const dailyCommittedLineCountNew = ref(initialState.stats.dailyCommittedLineCountNew)
  const dailyCommittedLineCountRemoved = ref(initialState.stats.dailyCommittedLineCountRemoved)
  const uncommittedFiles = ref(initialState.stats.uncommittedFiles)

  const statsRef = ref(null)
  console.log(statsRef.value)

  const errors = ref(initialState.errors)
</script>

<template>
  <main>
    <Stats
      :daily-commit-count="dailyCommitCount"
      :daily-committed-line-count-new="dailyCommittedLineCountNew"
      :daily-committed-line-count-removed="dailyCommittedLineCountRemoved"
      :uncommitted-files="uncommittedFiles"

      ref="statsRef"
    />
    <Errors :errors="errors" />
  </main>
</template>

<style scoped>
  header {
    line-height: 1.5;
  }

  .logo {
    display: block;
    margin: 0 auto 2rem;
  }

  @media (min-width: 1024px) {
    header {
      display: flex;
      place-items: center;
      padding-right: calc(var(--section-gap) / 2);
    }

    .logo {
      margin: 0 2rem 0 0;
    }

    header .wrapper {
      display: flex;
      place-items: flex-start;
      flex-wrap: wrap;
    }
  }
</style>
