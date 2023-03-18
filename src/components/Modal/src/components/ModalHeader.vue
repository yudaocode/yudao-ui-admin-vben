<template>
  <BasicTitle :helpMessage="helpMessage">
    {{ title }}
  </BasicTitle>
</template>
<script lang="ts" setup name="BasicModalHeader">
import { BasicTitle } from '@/components/Basic'

defineProps({
  helpMessage: {
    type: [String, Array] as PropType<string | string[]>
  },
  title: { type: String }
})
</script>
