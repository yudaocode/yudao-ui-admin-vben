<script lang="ts" setup>
import { ref } from 'vue'
import { IFrame } from '@/components/IFrame'

defineOptions({ name: 'ReportGoview' })

const src = ref('http://127.0.0.1:3000')
</script>

<template>
  <div>
    <IFrame :src="src" />
  </div>
</template>
