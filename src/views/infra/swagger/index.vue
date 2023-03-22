<template>
  <div>
    <IFrame :src="src" />
  </div>
</template>
<script setup lang="ts" name="Swagger">
import { ref } from 'vue'
import { IFrame } from '@/components/IFrame'

const BASE_URL = import.meta.env.VITE_GLOB_BASE_URL
// const src = ref(BASE_URL + '/doc.html')
const src = ref(BASE_URL + '/swagger-ui')
</script>
