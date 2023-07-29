<script lang="ts" setup>
import { BasicTitle } from '@/components/Basic'

defineOptions({ name: 'BasicModalHeader' })

defineProps({
  helpMessage: {
    type: [String, Array] as PropType<string | string[]>,
  },
  title: { type: String },
})
</script>

<template>
  <BasicTitle :help-message="helpMessage">
    {{ title }}
  </BasicTitle>
</template>
