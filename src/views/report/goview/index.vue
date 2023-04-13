<template>
  <div>
    <IFrame :src="src" />
  </div>
</template>
<script setup lang="ts" name="ReportGoview">
import { ref } from 'vue'
import { IFrame } from '@/components/IFrame'

const src = ref('http://127.0.0.1:3000')
</script>
