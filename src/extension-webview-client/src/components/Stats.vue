<script setup lang="ts">
  import { computed } from 'vue'
  import type { stats } from '../../../shared'

  const {
    dailyCommitCount,
    dailyCommittedLineCountNew,
    dailyCommittedLineCountRemoved,
    uncommittedFiles
  } = defineProps<stats>()

  const uncommittedLineCountNew = computed(() => uncommittedFiles.reduce((accumulator, uncommittedFile) => accumulator + uncommittedFile.lineCountNew, 0))
  const uncommittedLineCountRemoved = computed(() => uncommittedFiles.reduce((accumulator, uncommittedFile) => accumulator + uncommittedFile.lineCountRemoved, 0))
</script>

<template>
  <div id="stats">
    <div class="commitCount verticalStretch">
      <h3 class="header">Commits</h3>
      <p class="commitNumber">{{ dailyCommitCount }}</p>
    </div>
    <div class="lineCount">
      <div class="commmitted verticalStretch">
        <h3 class="header">Committed Lines</h3>
        <p class="new totalLineCount linesNew">+{{ dailyCommittedLineCountNew }}</p>
        <p class="removed totalLineCount linesRemoved">-{{ dailyCommittedLineCountRemoved }}</p>
      </div>
      <div class="uncommmitted verticalStretch">
        <h3 class="header">Uncommitted Lines</h3>
        <p class="new totalLineCount linesNew">+{{ uncommittedLineCountNew }}</p>
        <p class="removed totalLineCount linesRemoved">-{{ uncommittedLineCountRemoved }}</p>
      </div>
    </div>
    <div class="diffSummary">
      <p v-if="uncommittedFiles.length <= 0">No Files</p>
      <h3 v-else class="header">Uncommitted Files</h3>
      <p v-for="uncommittedFile in uncommittedFiles">
        <span class="fileName">{{ uncommittedFile.name }}</span>
        <span class="fileStats">
          <span class="linesNew">+{{ uncommittedFile.lineCountNew }}</span>
          <span class="linesRemoved">-{{ uncommittedFile.lineCountRemoved }}</span>
        </span>
      </p>
    </div>
  </div>
</template>

<style scoped>
  #stats {
    border: 4px solid var(--soft-white);
    display: flex;
    user-select: none;

    &>div {
      flex-grow: 1;
      padding: 1rem;
    }
  }

  .commitNumber {
    font-size: 90pt;
    font-weight: 999;
    transform: scale(2);
  }

  .diffSummary {
    flex-grow: 2;
    font-size: 12pt;
    text-align: left;

    p {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;

      .fileName {
        color: var(--bright-white)
      }

      .fileStats {
        margin-left: auto;

        span:first-child {
          margin-right: 0.5em;
        }
      }
    }

    .header {
      text-align: center;
    }
  }

  .header {
    font-size: 14pt;
    font-weight: bolder;
  }

  .lineCount {
    display: flex;

    &>div {
      flex-grow: 1;
    }
  }

  .linesNew {
    color: var(--gold)
  }

  .linesRemoved {
    color: var(--green)
  }

  .totalLineCount {
    font-size: 36pt;
    font-weight: bolder;
  }

  .verticalStretch {
    display: flex;
    flex-direction: column;

    &>* {
      flex-grow: 1;
    }
  }

  .viewHole {
    background-clip: text;
    color: transparent;
  }

  @media (min-aspect-ratio: 1/1) { /* wider */
    .commitCount {
      border-right: 2px solid var(--soft-white);
    }

    .diffSummary {
      border-left: 2px solid var(--soft-white);
    }

    .lineCount {
      border-left: 2px solid var(--soft-white);
      border-right: 2px solid var(--soft-white);
    }
  }

  @media (max-aspect-ratio: 1/1) { /* taller */
    #stats {
      flex-direction: column;
      width: 100%;

      .lineCount {
        border-bottom: 4px solid var(--soft-white);
        border-top: 4px solid var(--soft-white);
      }
    }
  }
</style>
