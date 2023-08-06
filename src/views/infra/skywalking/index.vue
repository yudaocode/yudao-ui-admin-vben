<script lang="ts" setup>
import { ref } from 'vue'
import { IFrame } from '@/components/IFrame'

defineOptions({ name: 'InfraSkywalking' })

const src = ref('http://skywalking.shop.iocoder.cn')
</script>

<template>
  <div>
    <IFrame :src="src" />
  </div>
</template>
