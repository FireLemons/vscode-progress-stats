<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import type { Stats } from '../../../shared'

  enum LineCountType {
    New,
    Removed
  }

  const props = defineProps<Stats>()
  const dailyUncommittedLineCountNew = computed(() => sumLineType(props.uncommittedFiles, LineCountType.New))
  const dailyUncommittedLineCountRemoved = computed(() => sumLineType(props.uncommittedFiles, LineCountType.Removed))

  let dailyCommittedLineCountNewDisplayed = ref(props.dailyCommittedLineCountNew)
  let dailyCommittedLineCountRemovedDisplayed = ref(props.dailyCommittedLineCountRemoved)
  let dailyUncommittedLineCountNewDisplayed = ref(dailyUncommittedLineCountNew.value)
  let dailyUncommittedLineCountRemovedDisplayed = ref(dailyUncommittedLineCountRemoved.value)

  let tickerId: number | undefined

  watch([props.dailyCommittedLineCountNew, props.dailyCommittedLineCountRemoved, dailyUncommittedLineCountNew, dailyUncommittedLineCountRemoved], async () => {
    initTicker()
  })

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

  function initTicker () {
    if (tickerId !== undefined) {
      return
    }

    tickerId = setInterval(() => {
      let statsFinishedUpdatingCount = 0

      if (props.dailyCommittedLineCountNew > dailyCommittedLineCountNewDisplayed.value) {
        dailyCommittedLineCountNewDisplayed.value++
      } else if (props.dailyCommittedLineCountNew < dailyCommittedLineCountNewDisplayed.value) {
        dailyCommittedLineCountNewDisplayed.value--
      } else {
        statsFinishedUpdatingCount++
      }

      if (props.dailyCommittedLineCountRemoved > dailyCommittedLineCountRemovedDisplayed.value) {
        dailyCommittedLineCountRemovedDisplayed.value++
      } else if (props.dailyCommittedLineCountRemoved < dailyCommittedLineCountRemovedDisplayed.value) {
        dailyCommittedLineCountRemovedDisplayed.value--
      } else {
        statsFinishedUpdatingCount++
      }

      if (dailyUncommittedLineCountNew.value > dailyUncommittedLineCountNewDisplayed.value) {
        dailyUncommittedLineCountNewDisplayed.value++
      } else if (dailyUncommittedLineCountNew.value < dailyUncommittedLineCountNewDisplayed.value) {
        dailyUncommittedLineCountNewDisplayed.value--
      } else {
        statsFinishedUpdatingCount++
      }

      if (dailyUncommittedLineCountRemoved.value > dailyUncommittedLineCountRemovedDisplayed.value) {
        dailyUncommittedLineCountRemovedDisplayed.value++
      } else if (dailyUncommittedLineCountRemoved.value < dailyUncommittedLineCountRemovedDisplayed.value) {
        dailyUncommittedLineCountRemovedDisplayed.value--
      } else {
        statsFinishedUpdatingCount++
      }

      if (statsFinishedUpdatingCount === 4) {
        clearInterval(tickerId)
        tickerId = undefined
      }
    }, 100)
  }

  function isNewLineCount (countType: LineCountType): boolean {
    return countType === LineCountType.New
  }

  function sumLineType (uncommittedFileStats: typeof props.uncommittedFiles, countType: LineCountType): number {
    const lineCountIndex = isNewLineCount(countType) ? 0 : 1

    return Object.values(uncommittedFileStats).reduce((accumulator, fileLineCounts) => {
      const lineCount = fileLineCounts[lineCountIndex]

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
        <p class="new totalLineCount" :class="getColorClassForLineCountValue(dailyCommittedLineCountNewDisplayed, LineCountType.New)">{{ getLineCountValue(dailyCommittedLineCountNewDisplayed, LineCountType.New) }}</p>
        <p class="removed totalLineCount" :class="getColorClassForLineCountValue(dailyCommittedLineCountRemovedDisplayed, LineCountType.Removed)">{{ getLineCountValue(dailyCommittedLineCountRemovedDisplayed, LineCountType.Removed) }}</p>
      </div>
      <div class="uncommmitted verticalStretch">
        <h3 class="header">Uncommitted Lines</h3>
        <p class="new totalLineCount" :class="getColorClassForLineCountValue(dailyUncommittedLineCountNewDisplayed, LineCountType.New)">{{ getLineCountValue(dailyUncommittedLineCountNewDisplayed, LineCountType.New) }}</p>
        <p class="removed totalLineCount" :class="getColorClassForLineCountValue(dailyUncommittedLineCountRemovedDisplayed, LineCountType.Removed)">{{ getLineCountValue(dailyUncommittedLineCountRemovedDisplayed, LineCountType.Removed) }}</p>
      </div>
    </div>
    <div class="diffSummary">
      <p v-if="Object.keys(uncommittedFiles).length <= 0">No Files</p>
      <h3 v-else class="header">Uncommitted Files</h3>
      <p v-for="(lineCounts, uncommittedFile) in uncommittedFiles">
        <span class="fileName">{{ uncommittedFile }}</span>
        <span class="fileStats">
          <span :class="getColorClassForLineCountValue(lineCounts[0], LineCountType.New)">{{ getLineCountValue(lineCounts[0], LineCountType.New) }}</span>
          <span :class="getColorClassForLineCountValue(lineCounts[1], LineCountType.Removed)">{{ getLineCountValue(lineCounts[1], LineCountType.Removed) }}</span>
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
    font-size: 72pt;
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
