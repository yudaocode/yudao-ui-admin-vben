<script setup lang="ts" name="InfraDruid">
import { ref } from 'vue'
import { IFrame } from '@/components/IFrame'

const src = ref(`${import.meta.env.VITE_GLOB_BASE_URL}/druid/index.html`)
</script>

<template>
  <div>
    <IFrame :src="src" />
  </div>
</template>
