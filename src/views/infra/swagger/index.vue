<script lang="ts" setup>
import { ref } from 'vue'
import { IFrame } from '@/components/IFrame'
import { DocAlert } from '@/components/DocAlert'

defineOptions({ name: 'InfraSwagger' })

// knife4j
// const src = ref(import.meta.env.VITE_GLOB_BASE_URL + '/doc.html')
const src = ref(`${import.meta.env.VITE_GLOB_BASE_URL}/swagger-ui`)
</script>

<template>
  <div>
    <DocAlert title="服务监控" url="https://doc.iocoder.cn/server-monitor/" />

    <IFrame :src="src" />
  </div>
</template>
