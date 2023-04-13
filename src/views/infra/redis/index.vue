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
      <Memory class="md:w-1/2 w-full" :loading="loading" :memoryHuman="memoryHuman" />
    </div>
    <div class="md:flex enter-y mt-4">
      <BasicTable @register="registerTable" @row-click="openKeyTemplate" />
    </div>
    <RedisModal @register="registerModal" />
  </div>
</template>
<script lang="ts" setup name="InfraRedis">
import { ref, onMounted } from 'vue'
import { useModal } from '@/components/Modal'
import { Description } from '@/components/Description'
import { BasicTable, useTable } from '@/components/Table'
import { baseInfoSchema, tableSchema } from './redis.data'
import RedisModal from './components/RedisModal.vue'
import { getCache, getKeyDefineList } from '@/api/infra/redis'
import { createAsyncComponent } from '@/utils/factory/createAsyncComponent'

const CommandStats = createAsyncComponent(() => import('./components/CommandStats.vue'))
const Memory = createAsyncComponent(() => import('./components/Memory.vue'))

const loading = ref(true)
const cacheInfo = ref<any>()
const commandStats = ref<any[]>([])
const memoryHuman = ref<any>()

async function getList() {
  const res = await getCache()
  cacheInfo.value = res.info
  memoryHuman.value = res.info.used_memory_human
  await res.commandStats.forEach((val) => {
    commandStats.value.push({ name: val.command, value: val.calls })
  })
  loading.value = false
}

const [registerTable] = useTable({
  loading,
  maxHeight: 400,
  title: '缓存列表',
  api: getKeyDefineList,
  rowKey: 'id',
  columns: tableSchema,
  pagination: false,
  useSearchForm: false,
  showTableSetting: false,
  showIndexColumn: false
})

const [registerModal, { openModal }] = useModal()

function openKeyTemplate(keyDefine) {
  openModal(true, { record: keyDefine.keyTemplate })
}

onMounted(async () => {
  await getList()
})
</script>
