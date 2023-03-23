<template>
  <div class="p-4">
    <Description
      title="基础信息"
      :collapseOptions="{ canExpand: true, helpMessage: 'Redis 基本信息' }"
      :column="6"
      :data="cacheInfo"
      :schema="baseInfoSchema"
    />
    <div class="md:flex enter-y mt-4">
      <CommandStats class="md:w-1/2 w-full" :loading="loading" :commandStats="commandStats" />
      <Memory class="md:w-1/2 !md:mx-4 !md:my-0 !my-4 w-full" :loading="loading" :cacheInfo="cacheInfo" />
    </div>
  </div>
</template>
<script lang="ts" setup name="Redis">
import { ref, onMounted } from 'vue'
import { Description } from '@/components/Description'
import { baseInfoSchema } from './redis.data'
// import { getCache, getKeyDefineList, getKeyList, getKeyValue, deleteKey, deleteKeys } from '@/api/infra/redis'
import { getCache } from '@/api/infra/redis'
import { createAsyncComponent } from '@/utils/factory/createAsyncComponent'

const CommandStats = createAsyncComponent(() => import('./components/CommandStats.vue'))
const Memory = createAsyncComponent(() => import('./components/Memory.vue'))

const loading = ref(true)
const cacheInfo = ref<any>()
const commandStats = ref<any[]>([])

async function getList() {
  const res = await getCache()
  cacheInfo.value = res.info
  await res.commandStats.forEach((val) => {
    commandStats.value.push({ name: val.command, value: val.calls })
  })
  loading.value = false
}

onMounted(async () => {
  await getList()
})
</script>
