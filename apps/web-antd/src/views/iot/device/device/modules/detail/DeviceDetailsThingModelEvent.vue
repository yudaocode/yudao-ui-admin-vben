<!-- 设备事件管理 -->
<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <a-form
      :model="queryParams"
      ref="queryFormRef"
      layout="inline"
      @submit.prevent
      style="margin-bottom: 16px;"
    >
      <a-form-item label="标识符" name="identifier">
        <a-select
          v-model:value="queryParams.identifier"
          placeholder="请选择事件标识符"
          allow-clear
          style="width: 240px;"
        >
          <a-select-option
            v-for="event in eventThingModels"
            :key="event.identifier"
            :value="event.identifier!"
          >
            {{ event.name }}({{ event.identifier }})
          </a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="时间范围" name="times">
        <a-range-picker
          v-model:value="queryParams.times"
          show-time
          format="YYYY-MM-DD HH:mm:ss"
          style="width: 360px;"
        />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" @click="handleQuery">
          <template #icon>
            <IconifyIcon icon="ep:search" />
          </template>
          搜索
        </a-button>
        <a-button @click="resetQuery" style="margin-left: 8px;">
          <template #icon>
            <IconifyIcon icon="ep:refresh" />
          </template>
          重置
        </a-button>
      </a-form-item>
    </a-form>

    <a-divider style="margin: 16px 0;" />
    
    <!-- 事件列表 -->
    <a-table v-loading="loading" :data-source="list" :pagination="false">
      <a-table-column title="上报时间" align="center" data-index="reportTime" :width="180">
        <template #default="{ record }">
          {{ record.request?.reportTime ? formatDate(record.request.reportTime) : '-' }}
        </template>
      </a-table-column>
      <a-table-column title="标识符" align="center" data-index="identifier" :width="160">
        <template #default="{ record }">
          <a-tag color="blue" size="small">
            {{ record.request?.identifier }}
          </a-tag>
        </template>
      </a-table-column>
      <a-table-column title="事件名称" align="center" data-index="eventName" :width="160">
        <template #default="{ record }">
          {{ getEventName(record.request?.identifier) }}
        </template>
      </a-table-column>
      <a-table-column title="事件类型" align="center" data-index="eventType" :width="100">
        <template #default="{ record }">
          {{ getEventType(record.request?.identifier) }}
        </template>
      </a-table-column>
      <a-table-column title="输入参数" align="center" data-index="params">
        <template #default="{ record }"> {{ parseParams(record.request.params) }} </template>
      </a-table-column>
    </a-table>

    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Pagination } from 'ant-design-vue'
import { ContentWrap } from '@vben/common-ui'
import { IconifyIcon } from '@vben/icons'
import { DeviceApi } from '#/api/iot/device/device'
import type { ThingModelData } from '#/api/iot/thingmodel'
import { formatDate } from '@vben/utils'
import {
  getEventTypeLabel,
  IotDeviceMessageMethodEnum,
  IoTThingModelTypeEnum
} from '#/views/iot/utils/constants'

const props = defineProps<{
  deviceId: number
  thingModelList: ThingModelData[]
}>()

const loading = ref(false) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([] as any[]) // 列表的数据
const queryParams = reactive({
  deviceId: props.deviceId,
  method: IotDeviceMessageMethodEnum.EVENT_POST.method, // 固定筛选事件消息
  identifier: '',
  times: [] as any[],
  pageNo: 1,
  pageSize: 10
})
const queryFormRef = ref() // 搜索的表单

/** 事件类型的物模型数据 */
const eventThingModels = computed(() => {
  return props.thingModelList.filter(
    (item: ThingModelData) => String(item.type) === String(IoTThingModelTypeEnum.EVENT)
  )
})

/** 查询列表 */
const getList = async () => {
  if (!props.deviceId) return
  loading.value = true
  try {
    const data = await DeviceApi.getDeviceMessagePairPage(queryParams)
    list.value = data.list || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields()
  queryParams.identifier = ''
  queryParams.times = []
  handleQuery()
}

/** 获取事件名称 */
const getEventName = (identifier: string | undefined) => {
  if (!identifier) return '-'
  const event = eventThingModels.value.find(
    (item: ThingModelData) => item.identifier === identifier
  )
  return event?.name || identifier
}

/** 获取事件类型 */
const getEventType = (identifier: string | undefined) => {
  if (!identifier) return '-'
  const event = eventThingModels.value.find(
    (item: ThingModelData) => item.identifier === identifier
  )
  if (!event?.event?.type) return '-'
  return getEventTypeLabel(event.event.type) || '-'
}

/** 解析参数 */
const parseParams = (params: string) => {
  try {
    const parsed = JSON.parse(params)
    if (parsed.params) {
      return parsed.params
    }
    return parsed
  } catch (error) {
    return {}
  }
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>

