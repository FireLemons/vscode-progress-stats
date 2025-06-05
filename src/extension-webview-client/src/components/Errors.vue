<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface ErrorWithUIState {
  isVisible: boolean
  message: string
  stack?: string
}

interface Props {
  errors?: {
    message: string
    stack?: string
  }[]
}

const {
  errors = []
} = defineProps<Props>()

const errorsState = ref<ErrorWithUIState[]>([])

onMounted(() => {
  errorsState.value = errors.map((error) => {
    return {
      ...error,
      isVisible: false
    }
  })
})

</script>

<template>
  <div id="errors" v-if="errorsState.length > 0">
    <h2 class="unselectable">Errors:</h2>
    <div v-for="error in errorsState">
      <label class="unselectable" v-on:click="error.isVisible = !error.isVisible">{{ error.isVisible ? '⮟' : '⮞' }} {{ error.message }}</label>
      <p v-show="error.isVisible">{{ error.stack }}</p>
    </div>
  </div>
</template>

<style scoped>
  label {
    cursor: pointer;
    font-size: 16pt;

    display: inline-block;
    width: 100%;
  }

  p {
    white-space: pre-wrap;
  }

  .unselectable {
    user-select: none;
  }

  #errors {
    margin-top: 1rem;
    text-align: left;

    div {
      color: var(--tasteful-red);
    }
  }
</style>
