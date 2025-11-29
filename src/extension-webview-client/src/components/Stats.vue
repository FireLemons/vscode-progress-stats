<script setup lang="ts">
  import CommitCount from './CommitCount.vue'
  import type { Stats } from '../../../shared'
  import { getNextEndOfDay } from '../../../endOfDay'
  import { computed, ref, toRefs, watch } from 'vue'

  enum LineCountType {
    New,
    Removed
  }

  interface Props extends Stats {
    backgroundImageCount: number
    gifImageCount: number
  }

  const props = defineProps<Props>()
  const dailyUncommittedLineCountNew = computed(() => sumLineType(props.uncommittedFiles, LineCountType.New))
  const dailyUncommittedLineCountRemoved = computed(() => sumLineType(props.uncommittedFiles, LineCountType.Removed))

  const { dailyCommittedLineCountNew, dailyCommittedLineCountRemoved } = toRefs(props)

  const dailyCommittedLineCountNewDisplayed = ref(props.dailyCommittedLineCountNew)
  const dailyCommittedLineCountRemovedDisplayed = ref(props.dailyCommittedLineCountRemoved)
  const dailyUncommittedLineCountNewDisplayed = ref(dailyUncommittedLineCountNew.value)
  const dailyUncommittedLineCountRemovedDisplayed = ref(dailyUncommittedLineCountRemoved.value)

  let endOfDay = getNextEndOfDay()
  const timeRemaining = ref(getTimeRemaining(endOfDay))

  let tickerId: number | undefined

  watch([dailyCommittedLineCountNew, dailyCommittedLineCountRemoved, dailyUncommittedLineCountNew, dailyUncommittedLineCountRemoved], async () => {
    initLineCountTicker()
  })

  initEndOfDayRefresh()

  function getColorClassForLineCountValue (value: number, countType: LineCountType): string {
    if (value < 0) {
      return 'errorValue'
    } else if (value === 0 || isNaN(value)) {
      return ''
    } else {
      return isNewLineCount(countType) ? 'linesNew' : 'linesRemoved'
    }
  }

  function getLineCountValue (lineCount: number, countType: LineCountType): string {
    const isSignedLineCountValue = !isNaN(lineCount) && lineCount > 0

    if (!isSignedLineCountValue) {
      return '-'
    }

    const sign = isNewLineCount(countType) ? '+' : '-'

    return sign + lineCount
  }

  function getTimeRemaining (endOfDay: Date): string {
    const millisecondsUntilEndOfDay = Math.round((endOfDay.valueOf() - (new Date()).valueOf()) / 60000) * 60000 // Rounding is done to correct for imprecision caused by minor delays

    if (millisecondsUntilEndOfDay < 0) {
      return '0 Min'
    } else if (millisecondsUntilEndOfDay < 3600000) { // one hour's worth of milliseconds
      return `${ Math.floor(millisecondsUntilEndOfDay / 60000) } Min`
    } else {
      const quarterHourMinuteEstimate = Math.floor(Math.floor((millisecondsUntilEndOfDay % 3600000) / 60000) / 15) * 15
      return `${ Math.floor(millisecondsUntilEndOfDay / 3600000) }:${ quarterHourMinuteEstimate === 0 ? '00' : quarterHourMinuteEstimate }`
    }
  }

  function initEndOfDayRefresh () {
    const initiationTime = new Date()

    setTimeout(() => {
      setInterval(() => {
        const now = new Date()

        if (now.valueOf() - endOfDay.valueOf() >= 0) {
          endOfDay = getNextEndOfDay()
        }

        timeRemaining.value = getTimeRemaining(endOfDay)
      }, 60000)
    }, 60000 - (initiationTime.getSeconds() * 1000 + initiationTime.getMilliseconds()))
  }

  function initLineCountTicker () {
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
    <div class="timer verticalStretch">
      <h3 class="header">Time Left</h3>
      <p class="time" >{{ timeRemaining }}</p>
    </div>
    <CommitCount :backgroundImageCount="props.backgroundImageCount" :daily-commit-count="dailyCommitCount" :gif-image-count="gifImageCount" />
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
    color: var(--soft-white);
    display: flex;
    user-select: none;

    &>div {
      flex-grow: 1;
      padding: 0 1rem;
    }

    &>.commitCount {
      padding: 0;
    }
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

  .time {
    font-size: 72pt;
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
    .diffSummary {
      border-left: 2px solid var(--soft-white);
      max-height: 13.25em;
      overflow-y: auto;
    }

    .lineCount {
      border-left: 2px solid var(--soft-white);
      border-right: 2px solid var(--soft-white);
    }

    .timer {
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
