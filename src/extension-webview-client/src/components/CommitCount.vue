<script setup lang="ts">
  interface Props {
    dailyCommitCount: number
    backgroundImageCount: number
  }

  const { dailyCommitCount, backgroundImageCount } = defineProps<Props>()

  function getRandomBackground (): string {
    const selection = Math.floor(Math.random() * backgroundImageCount)

    return `bg-img-${selection}`
  }

  function getStreakStyleClasses (): string {
    let classes = ''

    if (dailyCommitCount >= 2) {
      classes += getRandomBackground() + ' '
    }

    return classes
  }
</script>

<template>
  <div class="commitCount verticalStretch" :class="getStreakStyleClasses()">
    <h3 class="header">Commits</h3>
    <p class="commitNumber" :class="{ errorValue: dailyCommitCount < 0 }" >{{ dailyCommitCount }}</p>
  </div>
</template>

<style scoped>
  .commitCount {
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
  }

  .commitNumber {
    font-size: 72pt;
    font-weight: 999;
    transform: scale(2);
  }

  .header {
    font-size: 14pt;
    font-weight: bolder;
  }

  @media (min-aspect-ratio: 1/1) { /* wider */
    .commitCount {
      border-left: 2px solid var(--soft-white);
      border-right: 2px solid var(--soft-white);
    }
  }

  @media (max-aspect-ratio: 1/1) { /* taller */
    .commitCount {
      border-top: 4px solid var(--soft-white);
    }
  }
</style>
