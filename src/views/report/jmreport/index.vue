<template>
  <div>
    <IFrame :src="src" />
  </div>
</template>
<script setup lang="ts" name="ReportJmreport">
import { ref } from 'vue'
import { IFrame } from '@/components/IFrame'
import { getAccessToken } from '@/utils/auth'

const src = ref(import.meta.env.VITE_GLOB_BASE_URL + '/jmreport/list?token=' + getAccessToken())
</script>
