<script setup lang="ts">
import { ref, toRefs, watch } from 'vue';

  interface Props {
    dailyCommitCount: number
    backgroundImageCount: number
    gifImageCount: number
  }

  const props = defineProps<Props>()
  const { backgroundImageCount, gifImageCount } = props
  const { dailyCommitCount } = toRefs(props)
  const isCommitNumberGlowing = ref(false)

  function animateCommitNumberGlowGold() {
    isCommitNumberGlowing.value = true
    setTimeout(() => {
      isCommitNumberGlowing.value = false
    }, 1000)
  }

  function getTwoCommitStreakRandomBackground (): string {
    const selection = Math.floor(Math.random() * backgroundImageCount)

    return dailyCommitCount.value >= 2 ? `bg-img-${selection}` : ''
  }

  function getFourCommitStreakRandomGifTextBackground (): string {
    const selection = Math.floor(Math.random() * gifImageCount)

    return dailyCommitCount.value >= 4 ? `text-bg-img text-bg-img-${selection}` : ''
  }

  watch(dailyCommitCount, animateCommitNumberGlowGold)
</script>

<template>
  <div class="commitCount verticalStretch" :class="getTwoCommitStreakRandomBackground()">
    <h3 class="header">Commits</h3>
    <p class="commitNumber" :class="[{ errorValue: dailyCommitCount < 0, glow: isCommitNumberGlowing }, getFourCommitStreakRandomGifTextBackground()]" >{{ dailyCommitCount }}</p>
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

  @keyframes golden-glow {
    0% {
    }
    50% {
      color: #fff176;
      text-shadow: #fff176 0 0 16px;
    }
    100% {
    }
  }

  .glow {
    animation: golden-glow 1s
  }
</style>
