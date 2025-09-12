<script setup lang="ts">
  import type { StatsSearchResult } from '../../shared'
  import Errors from './components/Errors.vue'
  import Stats from './components/Stats.vue'
  import { ref } from 'vue'

  const initialState = window.__INITIAL_STATE__

  const { backgroundImageCount, gifImageCount } = initialState

  let dailyCommitCount = ref(initialState.stats.dailyCommitCount)
  let dailyCommittedLineCountNew = ref(initialState.stats.dailyCommittedLineCountNew)
  let dailyCommittedLineCountRemoved = ref(initialState.stats.dailyCommittedLineCountRemoved)
  let errors = ref(initialState.errors)
  let uncommittedFiles = ref(initialState.stats.uncommittedFiles)

  window.addEventListener('message', (event) => {
    const message:StatsSearchResult = event.data
    const stats = message.stats

    errors.value = message.errors
    dailyCommitCount.value = stats.dailyCommitCount
    dailyCommittedLineCountNew.value = stats.dailyCommittedLineCountNew
    dailyCommittedLineCountRemoved.value = stats.dailyCommittedLineCountRemoved
    uncommittedFiles.value = stats.uncommittedFiles
  })
</script>

<template>
  <main>
    <Stats
      :background-image-count="backgroundImageCount"
      :daily-commit-count="dailyCommitCount"
      :daily-committed-line-count-new="dailyCommittedLineCountNew"
      :daily-committed-line-count-removed="dailyCommittedLineCountRemoved"
      :gif-image-count="gifImageCount"
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
