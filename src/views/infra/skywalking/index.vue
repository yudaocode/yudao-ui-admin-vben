<template>
  <div>
    <IFrame :src="src" />
  </div>
</template>
<script setup lang="ts" name="InfraSkywalking">
import { ref } from 'vue'
import { IFrame } from '@/components/IFrame'

const src = ref('http://skywalking.shop.iocoder.cn')
</script>
