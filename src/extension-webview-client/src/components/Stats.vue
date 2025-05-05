<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  commitCount?: Number
  committedLineCountNew?: Number
  committedLineCountRemoved?: Number
  uncommittedFiles?: {
    name: String
    lineCountNew: Number
    lineCountRemoved: Number
  }[]
}

const {
  commitCount = 0,
  committedLineCountNew = 0,
  committedLineCountRemoved = 0,
  uncommittedFiles = []
} = defineProps<Props>()

const uncommittedLineCountNew = computed(() => uncommittedFiles.reduce((accumulator, uncommittedFile) => accumulator + uncommittedFile.lineCountNew, 0))
const uncommittedLineCountRemoved = computed(() => uncommittedFiles.reduce((accumulator, uncommittedFile) => accumulator + uncommittedFile.lineCountRemoved, 0))
</script>

<template>
  <div id="stats">
    <div class="commitCount">
      <h3 class="header">Commits</h3>
      <p class="commitNumber">{{ commitCount }}</p>
    </div>
    <div class="lineCount">
      <div class="commmitted">
        <h3 class="header">Committed Lines</h3>
        <p class="new lineCountNumber">{{ committedLineCountNew }}</p>
        <p class="removed lineCountNumber">{{ committedLineCountRemoved }}</p>
      </div>
      <div class="uncommmitted">
        <h3 class="header">Uncommitted Lines</h3>
        <p class="new lineCountNumber">{{ committedLineCountNew }}</p>
        <p class="removed lineCountNumber">{{ committedLineCountRemoved }}</p>
      </div>
    </div>
    <div class="diffSummary">
      <p v-if="uncommittedFiles.length <= 0">No Files</p>
      <p v-for="uncommittedFile in uncommittedFiles">
        <span class="fileName">{{ uncommittedFile.name }}</span>
        <span class="fileStats">
          <span class="lineCountNew">+{{ uncommittedFile.lineCountNew }}</span>
          <span class="lineCountRemoved">-{{ uncommittedFile.lineCountRemoved }}</span>
        </span>
      </p>
    </div>
  </div>
</template>

<style scoped>
  .diffSummary {
    text-align: left;
  }

  .viewHole {
    background-clip: text;
    color: transparent;
  }

  #stats {
    border: 4px solid #bdbdbd;
    display: flex;

    &>div {
      flex-grow: 1;
      padding: 1rem;
    }

    .commitCount {
      .commitNumber {
        font-size: 72pt;
        font-weight: bolder;
      }
    }

    .diffSummary {
      flex-grow: 2;
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

    .lineCountNumber {
      font-size: 36pt;
      font-weight: bolder;
    }
  }

  @media (min-aspect-ratio: 1/1) { /* wider */
    .commitCount {
      border-right: 2px solid #bdbdbd;
    }

    .diffSummary {
      border-left: 2px solid #bdbdbd;
    }

    .lineCount {
      border-left: 2px solid #bdbdbd;
      border-right: 2px solid #bdbdbd;
    }
  }

  @media (max-aspect-ratio: 1/1) { /* taller */
    #stats {
      flex-direction: column;
      width: 100%;
    }
  }
</style>
