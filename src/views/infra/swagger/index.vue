<template>
  <div>
    <IFrame :src="src" />
  </div>
</template>
<script setup lang="ts" name="InfraSwagger">
import { ref } from 'vue'
import { IFrame } from '@/components/IFrame'
// knife4j
// const src = ref(import.meta.env.VITE_GLOB_BASE_URL + '/doc.html')
const src = ref(import.meta.env.VITE_GLOB_BASE_URL + '/swagger-ui')
</script>
