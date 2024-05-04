<script lang="ts" setup>
import { ref } from 'vue'
import { IFrame } from '@/components/IFrame'
import { getAccessToken } from '@/utils/auth'
import { DocAlert } from '@/components/DocAlert'

defineOptions({ name: 'ReportJmreport' })

const src = ref(`${import.meta.env.VITE_GLOB_BASE_URL}/jmreport/list?token=${getAccessToken()}`)
</script>

<template>
  <div>
    <DocAlert title="报表设计器" url="https://doc.iocoder.cn/report/" />

    <IFrame :src="src" />
  </div>
</template>
