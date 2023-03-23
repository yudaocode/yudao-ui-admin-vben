<template>
  <div>
    <Description
      title="基础信息"
      :collapseOptions="{ canExpand: true, helpMessage: 'Redis 基本信息' }"
      :column="6"
      :data="cacheInfo"
      :schema="baseInfoSchema"
    />
  </div>
</template>
<script lang="ts" setup name="Redis">
import { Description } from '@/components/Description'
import { baseInfoSchema } from './redis.data'
// import { getCache, getKeyDefineList, getKeyList, getKeyValue, deleteKey, deleteKeys } from '@/api/infra/redis'
import { getCache } from '@/api/infra/redis'
import { ref } from 'vue'
import { onMounted } from 'vue'

const cacheInfo = ref()
const commandStats = ref()

async function getList() {
  const res = await getCache()
  cacheInfo.value = res.info
  commandStats.value = res.commandStats
}

onMounted(async () => {
  await getList()
})
</script>
