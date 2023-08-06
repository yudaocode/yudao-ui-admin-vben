<script lang="ts" setup>
import { ref } from 'vue'
import { IFrame } from '@/components/IFrame'

defineOptions({ name: 'InfraServer' })

const src = ref(`${import.meta.env.VITE_GLOB_BASE_URL}/admin/applications`)
</script>

<template>
  <div>
    <IFrame :src="src" />
  </div>
</template>
