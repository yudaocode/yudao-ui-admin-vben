<script lang="ts" setup>
import { ref } from 'vue'
import { IFrame } from '@/components/IFrame'
import { getAccessToken } from '@/utils/auth'

defineOptions({ name: 'ReportJmreport' })

const src = ref(`${import.meta.env.VITE_GLOB_BASE_URL}/jmreport/list?token=${getAccessToken()}`)
</script>

<template>
  <div>
    <IFrame :src="src" />
  </div>
</template>
