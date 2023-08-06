<script lang="ts" setup>
import { ref } from 'vue'
import { IFrame } from '@/components/IFrame'

defineOptions({ name: 'InfraSwagger' })

// knife4j
// const src = ref(import.meta.env.VITE_GLOB_BASE_URL + '/doc.html')
const src = ref(`${import.meta.env.VITE_GLOB_BASE_URL}/swagger-ui`)
</script>

<template>
  <div>
    <IFrame :src="src" />
  </div>
</template>
