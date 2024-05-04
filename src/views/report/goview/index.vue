<script lang="ts" setup>
import { ref } from 'vue'
import { IFrame } from '@/components/IFrame'
import { DocAlert } from '@/components/DocAlert'

defineOptions({ name: 'ReportGoview' })

const src = ref('http://127.0.0.1:3000')
</script>

<template>
  <div>
    <DocAlert title="大屏设计器" url="https://doc.iocoder.cn/report/screen/" />

    <IFrame :src="src" />
  </div>
</template>
