<script lang="ts" setup>
import { ref } from 'vue'
import { IFrame } from '@/components/IFrame'
import { DocAlert } from '@/components/DocAlert'

defineOptions({ name: 'InfraSkywalking' })

const src = ref('http://skywalking.shop.iocoder.cn')
</script>

<template>
  <div>
    <DocAlert title="服务监控" url="https://doc.iocoder.cn/server-monitor/" />

    <IFrame :src="src" />
  </div>
</template>
