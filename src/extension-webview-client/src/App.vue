<script setup lang="ts">
import Errors from './components/Errors.vue'
import Stats from './components/Stats.vue'
import { ref } from 'vue'

const commitCount = ref(0)
const committedLineCountNew = ref(0)
const committedLineCountRemoved = ref(0)
const uncommittedFiles = ref([])

const statsRef = ref(null)
console.log(statsRef.value)

const testError = new Error('Test Test')
const errors = [{
  message: testError.message,
  stack: testError.stack
}]
</script>

<template>
  <main>
    <Stats msg="You did it!" ref="statsRef" />
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
