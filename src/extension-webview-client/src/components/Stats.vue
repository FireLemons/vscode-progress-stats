<script setup lang="ts">
  import { computed } from 'vue'
  import type { stats } from '../../../shared'

  enum LineCountType {
    New,
    Removed
  }

  const {
    dailyCommitCount,
    dailyCommittedLineCountNew,
    dailyCommittedLineCountRemoved,
    uncommittedFiles
  } = defineProps<stats>()

  const dailyUncommitedLineCountNew = computed(() => sumLineType(uncommittedFiles, LineCountType.New))
  const dailyUncommitedLineCountRemoved = computed(() => sumLineType(uncommittedFiles, LineCountType.Removed))

  function getColorClassForLineCountValue (value: number, countType: LineCountType): string {
    if (value < 0) {
      return 'errorValue'
    } else if (value === 0 || isNaN(value)) {
      return ''
    } else {
      return isNewLineCount(countType) ? 'linesNew' : 'linesRemoved'
    }
  }

  function getLineCountValue (lineCount: number, countType: LineCountType): string | number {
    const isSignedLineCountValue = !isNaN(lineCount) && lineCount > 0

    if (!isSignedLineCountValue) {
      return lineCount
    }

    const sign = isNewLineCount(countType) ? '+' : '-'

    return sign + lineCount
  }

  function isNewLineCount (countType: LineCountType): boolean {
    return countType === LineCountType.New
  }

  function sumLineType (uncommittedFileStats: typeof uncommittedFiles, countType: LineCountType): number {
    const statKey = isNewLineCount(countType) ? 'lineCountNew' : 'lineCountRemoved'

    return uncommittedFileStats.reduce((accumulator, uncommittedFile) => {
      const lineCount = uncommittedFile[statKey]

      return accumulator + (isNaN(lineCount) ? 0 : lineCount)
    }, 0)
  }

</script>

<template>
  <div id="stats">
    <div class="commitCount verticalStretch">
      <h3 class="header">Commits</h3>
      <p class="commitNumber" :class="{ errorValue: dailyCommitCount < 0 }" >{{ dailyCommitCount }}</p>
    </div>
    <div class="lineCount">
      <div class="commmitted verticalStretch">
        <h3 class="header">Committed Lines</h3>
        <p class="new totalLineCount" :class="getColorClassForLineCountValue(dailyCommittedLineCountNew, LineCountType.New)">{{ getLineCountValue(dailyCommittedLineCountNew, LineCountType.New) }}</p>
        <p class="removed totalLineCount" :class="getColorClassForLineCountValue(dailyCommittedLineCountRemoved, LineCountType.Removed)">{{ getLineCountValue(dailyCommittedLineCountRemoved, LineCountType.Removed) }}</p>
      </div>
      <div class="uncommmitted verticalStretch">
        <h3 class="header">Uncommitted Lines</h3>
        <p class="new totalLineCount" :class="getColorClassForLineCountValue(dailyUncommitedLineCountNew, LineCountType.New)">{{ getLineCountValue(dailyUncommitedLineCountNew, LineCountType.New) }}</p>
        <p class="removed totalLineCount" :class="getColorClassForLineCountValue(dailyUncommitedLineCountRemoved, LineCountType.Removed)">{{ getLineCountValue(dailyUncommitedLineCountRemoved, LineCountType.Removed) }}</p>
      </div>
    </div>
    <div class="diffSummary">
      <p v-if="uncommittedFiles.length <= 0">No Files</p>
      <h3 v-else class="header">Uncommitted Files</h3>
      <p v-for="uncommittedFile in uncommittedFiles">
        <span class="fileName">{{ uncommittedFile.name }}</span>
        <span class="fileStats">
          <span :class="getColorClassForLineCountValue(uncommittedFile.lineCountNew, LineCountType.New)">{{ getLineCountValue(uncommittedFile.lineCountNew, LineCountType.New) }}</span>
          <span :class="getColorClassForLineCountValue(uncommittedFile.lineCountRemoved, LineCountType.Removed)">{{ getLineCountValue(uncommittedFile.lineCountRemoved, LineCountType.Removed) }}</span>
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

  .errorValue {
    color: var(--tasteful-red)
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
