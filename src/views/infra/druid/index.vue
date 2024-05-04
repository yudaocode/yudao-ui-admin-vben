<script setup lang="ts" name="InfraDruid">
import { ref } from 'vue'
import { IFrame } from '@/components/IFrame'
import { DocAlert } from '@/components/DocAlert'

const src = ref(`${import.meta.env.VITE_GLOB_BASE_URL}/druid/index.html`)
</script>

<template>
  <div>
    <DocAlert title="数据库 MyBatis" url="https://doc.iocoder.cn/mybatis/" />
    <DocAlert title="多数据源（读写分离）" url="https://doc.iocoder.cn/dynamic-datasource/" />

    <IFrame :src="src" />
  </div>
</template>
