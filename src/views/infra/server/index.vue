<template>
  <div>
    <IFrame :src="src" />
  </div>
</template>
<script setup lang="ts" name="InfraServer">
import { ref } from 'vue'
import { IFrame } from '@/components/IFrame'

const src = ref(import.meta.env.VITE_GLOB_BASE_URL + '/admin/applications')
</script>
