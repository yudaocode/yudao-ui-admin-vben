<!-- 设备属性管理 -->
<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <div class="flex items-center justify-between" style="margin-bottom: 16px;">
      <div class="flex items-center" style="gap: 16px;">
        <a-input
          v-model:value="queryParams.keyword"
          placeholder="请输入属性名称、标识符"
          allow-clear
          style="width: 240px;"
          @pressEnter="handleQuery"
        />
        <div class="flex items-center" style="gap: 8px;">
          <span style="font-size: 14px; color: #666;">自动刷新</span>
          <a-switch
            v-model:checked="autoRefresh"
            size="small"
          />
        </div>
      </div>
      <a-button-group>
        <a-button :type="viewMode === 'card' ? 'primary' : 'default'" @click="viewMode = 'card'">
          <IconifyIcon icon="ep:grid" />
        </a-button>
        <a-button :type="viewMode === 'list' ? 'primary' : 'default'" @click="viewMode = 'list'">
          <IconifyIcon icon="ep:list" />
        </a-button>
      </a-button-group>
    </div>
    
    <!-- 分隔线 -->
    <a-divider style="margin: 16px 0;" />
    
    <!-- 卡片视图 -->
    <template v-if="viewMode === 'card'">
      <a-row :gutter="16" v-loading="loading">
        <a-col
          v-for="item in list"
          :key="item.identifier"
          :xs="24"
          :sm="12"
          :md="12"
          :lg="6"
          class="mb-4"
        >
          <a-card
            class="h-full transition-colors relative overflow-hidden"
            :body-style="{ padding: '0' }"
          >
            <!-- 添加渐变背景层 -->
            <div
              class="absolute top-0 left-0 right-0 h-[50px] pointer-events-none bg-gradient-to-b from-[#eefaff] to-transparent"
            >
            </div>
            <div class="p-4 relative">
              <!-- 标题区域 -->
              <div class="flex items-center mb-3">
                <div class="mr-2.5 flex items-center">
                  <IconifyIcon icon="ep:cpu" class="text-[18px] text-[#0070ff]" />
                </div>
                <div class="text-[16px] font-600 flex-1">{{ item.name }}</div>
                <!-- 标识符 -->
                <div class="inline-flex items-center mr-2">
                  <a-tag size="small" color="blue">
                    {{ item.identifier }}
                  </a-tag>
                </div>
                <!-- 数据类型标签 -->
                <div class="inline-flex items-center mr-2">
                  <a-tag size="small">
                    {{ item.dataType }}
                  </a-tag>
                </div>
                <!-- 数据图标 - 可点击 -->
                <div
                  class="cursor-pointer flex items-center justify-center w-8 h-8 rounded-full hover:bg-blue-50 transition-colors"
                  @click="openHistory(props.deviceId, item.identifier, item.dataType)"
                >
                  <IconifyIcon icon="ep:data-line" class="text-[18px] text-[#0070ff]" />
                </div>
              </div>

              <!-- 信息区域 -->
              <div class="text-[14px]">
                <div class="mb-2.5 last:mb-0">
                  <span class="text-[#717c8e] mr-2.5">属性值</span>
                  <span class="text-[#0b1d30] font-600">
                    {{ formatValueWithUnit(item) }}
                  </span>
                </div>
                <div class="mb-2.5 last:mb-0">
                  <span class="text-[#717c8e] mr-2.5">更新时间</span>
                  <span class="text-[#0b1d30] text-[12px]">
                    {{ item.updateTime ? formatDate(item.updateTime) : '-' }}
                  </span>
                </div>
              </div>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </template>

    <!-- 列表视图 -->
    <a-table v-else v-loading="loading" :data-source="list" :pagination="false">
      <a-table-column title="属性标识符" align="center" data-index="identifier" />
      <a-table-column title="属性名称" align="center" data-index="name" />
      <a-table-column title="数据类型" align="center" data-index="dataType" />
      <a-table-column title="属性值" align="center" data-index="value">
        <template #default="{ record }">
          {{ formatValueWithUnit(record) }}
        </template>
      </a-table-column>
      <a-table-column
        title="更新时间"
        align="center"
        data-index="updateTime"
        :width="180"
      >
        <template #default="{ record }">
          {{ record.updateTime ? formatDate(record.updateTime) : '-' }}
        </template>
      </a-table-column>
      <a-table-column title="操作" align="center">
        <template #default="{ record }">
          <a-button
            type="link"
            @click="openHistory(props.deviceId, record.identifier, record.dataType)"
          >
            查看数据
          </a-button>
        </template>
      </a-table-column>
    </a-table>

    <!-- 表单弹窗：添加/修改 -->
    <DeviceDetailsThingModelPropertyHistory ref="historyRef" :deviceId="props.deviceId" />
  </ContentWrap>
</template>

<style scoped>
/* 移除 a-row 的额外边距 */
:deep(.ant-row) {
  margin-left: -8px !important;
  margin-right: -8px !important;
}
</style>
<script setup lang="ts">
import { ref, reactive, watch, onMounted, onBeforeUnmount } from 'vue'
import { ContentWrap } from '@vben/common-ui'
import { IconifyIcon } from '@vben/icons'
import { DeviceApi, type IotDevicePropertyDetailRespVO } from '#/api/iot/device/device'
import { formatDate } from '@vben/utils'
import DeviceDetailsThingModelPropertyHistory from './DeviceDetailsThingModelPropertyHistory.vue'

const props = defineProps<{ deviceId: number }>()

const loading = ref(true) // 列表的加载中
const list = ref<IotDevicePropertyDetailRespVO[]>([]) // 显示的列表数据
const filterList = ref<IotDevicePropertyDetailRespVO[]>([]) // 完整的数据列表
const queryParams = reactive({
  keyword: '' as string
})
const autoRefresh = ref(false) // 自动刷新开关
let autoRefreshTimer: any = null // 定时器
const viewMode = ref<'card' | 'list'>('card') // 视图模式状态

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const params = {
      deviceId: props.deviceId,
      identifier: undefined as string | undefined,
      name: undefined as string | undefined
    }
    filterList.value = await DeviceApi.getLatestDeviceProperties(params)
    handleFilter()
  } finally {
    loading.value = false
  }
}

/** 前端筛选数据 */
const handleFilter = () => {
  if (!queryParams.keyword.trim()) {
    list.value = filterList.value
  } else {
    const keyword = queryParams.keyword.toLowerCase()
    list.value = filterList.value.filter(
      (item: IotDevicePropertyDetailRespVO) =>
        item.identifier?.toLowerCase().includes(keyword) ||
        item.name?.toLowerCase().includes(keyword)
    )
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  handleFilter()
}

/** 历史操作 */
const historyRef = ref()
const openHistory = (deviceId: number, identifier: string, dataType: string) => {
  historyRef.value.open(deviceId, identifier, dataType)
}

/** 格式化属性值和单位 */
const formatValueWithUnit = (item: IotDevicePropertyDetailRespVO) => {
  if (item.value === null || item.value === undefined || item.value === '') {
    return '-'
  }
  const unitName = item.dataSpecs?.unitName
  return unitName ? `${item.value} ${unitName}` : item.value
}

/** 监听自动刷新 */
watch(autoRefresh, (newValue) => {
  if (newValue) {
    autoRefreshTimer = setInterval(() => {
      getList()
    }, 5000) // 每 5 秒刷新一次
  } else {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }
})

/** 组件卸载时清除定时器 */
onBeforeUnmount(() => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
  }
})

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>

