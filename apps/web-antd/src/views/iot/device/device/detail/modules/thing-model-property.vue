<!-- 设备属性管理 -->
<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { IotDeviceApi } from '#/api/iot/device/device';

import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import {
  Button,
  Card,
  Col,
  Divider,
  Input,
  Row,
  Switch,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getLatestDeviceProperties } from '#/api/iot/device/device';

import DeviceDetailsThingModelPropertyHistory from './thing-model-property-history.vue';

const props = defineProps<{ deviceId: number }>();

const loading = ref(true); // 列表的加载中
const list = ref<IotDeviceApi.DevicePropertyDetail[]>([]); // 显示的列表数据
const filterList = ref<IotDeviceApi.DevicePropertyDetail[]>([]); // 完整的数据列表
const queryParams = reactive({
  keyword: '' as string,
}); // 查询参数
const autoRefresh = ref(false); // 自动刷新开关
let autoRefreshTimer: any = null; // 定时器
const viewMode = ref<'card' | 'list'>('card'); // 视图模式状态

/** Grid 列定义 */
function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'identifier',
      title: '属性标识符',
    },
    {
      field: 'name',
      title: '属性名称',
    },
    {
      field: 'dataType',
      title: '数据类型',
    },
    {
      field: 'value',
      title: '属性值',
      slots: { default: 'value' },
    },
    {
      field: 'updateTime',
      title: '更新时间',
      width: 180,
      slots: { default: 'updateTime' },
    },
    {
      title: '操作',
      width: 120,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 创建 Grid 实例 */
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    rowConfig: {
      keyField: 'identifier',
      isHover: true,
    },
    proxyConfig: {
      ajax: {
        query: async () => {
          if (!props.deviceId) {
            return { list: [], total: 0 };
          }
          const data = await getLatestDeviceProperties({
            deviceId: props.deviceId,
            identifier: undefined,
            name: undefined,
          });
          // 筛选数据
          let filteredData = data;
          if (queryParams.keyword.trim()) {
            const keyword = queryParams.keyword.toLowerCase();
            filteredData = data.filter(
              (item: IotDeviceApi.DevicePropertyDetail) =>
                item.identifier?.toLowerCase().includes(keyword) ||
                item.name?.toLowerCase().includes(keyword),
            );
          }
          // 更新本地列表用于卡片视图
          filterList.value = data;
          list.value = filteredData;
          return {
            list: filteredData,
            total: filteredData.length,
          };
        },
      },
    },
    toolbarConfig: {
      refresh: false,
      search: false,
    },
    pagerConfig: {
      enabled: false,
    },
  } as VxeTableGridOptions<IotDeviceApi.DevicePropertyDetail>,
});

// 包装 gridApi.query() 方法，统一列表视图和卡片视图的查询接口
gridApi.query = async () => {
  if (viewMode.value === 'list') {
    // 列表视图：手动获取数据并加载到 Grid
    if (!props.deviceId) {
      return;
    }
    const data = await getLatestDeviceProperties({
      deviceId: props.deviceId,
      identifier: undefined,
      name: undefined,
    });
    const dataArray = Array.isArray(data) ? data : [];
    let filteredData = dataArray;
    if (queryParams.keyword.trim()) {
      const keyword = queryParams.keyword.toLowerCase();
      filteredData = dataArray.filter(
        (item: IotDeviceApi.DevicePropertyDetail) =>
          item.identifier?.toLowerCase().includes(keyword) ||
          item.name?.toLowerCase().includes(keyword),
      );
    }
    filterList.value = dataArray;
    list.value = filteredData;
    // 直接加载数据到 Grid
    if (gridApi.grid) {
      gridApi.grid.loadData(filteredData);
    }
  } else {
    // 卡片视图：调用 getList 方法
    await getList();
  }
};

/** 查询列表 */
async function getList() {
  loading.value = true;
  try {
    if (viewMode.value === 'list') {
      await gridApi.query();
    } else {
      // 卡片视图：手动获取数据
      const params = {
        deviceId: props.deviceId,
        identifier: undefined as string | undefined,
        name: undefined as string | undefined,
      };
      filterList.value = await getLatestDeviceProperties(params);
      handleFilter();
    }
  } finally {
    loading.value = false;
  }
}

/** 前端筛选数据 */
function handleFilter() {
  if (queryParams.keyword.trim()) {
    const keyword = queryParams.keyword.toLowerCase();
    list.value = filterList.value.filter(
      (item: IotDeviceApi.DevicePropertyDetail) =>
        item.identifier?.toLowerCase().includes(keyword) ||
        item.name?.toLowerCase().includes(keyword),
    );
  } else {
    list.value = filterList.value;
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  if (viewMode.value === 'list') {
    gridApi.query();
  } else {
    handleFilter();
  }
}

/** 视图切换 */
async function handleViewModeChange(mode: 'card' | 'list') {
  if (viewMode.value === mode) {
    return;
  }
  viewMode.value = mode;
  await nextTick();
  gridApi.query();
}

/** 历史操作 */
const historyRef = ref();
function openHistory(deviceId: number, identifier: string, dataType: string) {
  historyRef.value.open(deviceId, identifier, dataType);
}

/** 格式化属性值和单位 */
function formatValueWithUnit(item: IotDeviceApi.DevicePropertyDetail) {
  if (item.value === null || item.value === undefined || item.value === '') {
    return '-';
  }
  const unitName = item.dataSpecs?.unitName;
  return unitName ? `${item.value} ${unitName}` : item.value;
}

/** 监听自动刷新 */
watch(autoRefresh, (newValue) => {
  if (newValue) {
    autoRefreshTimer = setInterval(() => {
      gridApi.query();
    }, 5000);
  } else {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
});

/** 监听设备标识变化 */
watch(
  () => props.deviceId,
  (newValue) => {
    if (newValue) {
      gridApi.query();
    }
  },
);

/** 初始化 */
onMounted(async () => {
  if (props.deviceId) {
    await nextTick();
    gridApi.query();
  }
});

/** 组件卸载时清除定时器 */
onBeforeUnmount(() => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
});
</script>

<template>
  <Page auto-content-height>
    <!-- 搜索工作栏 -->
    <div class="flex items-center justify-between" style="margin-bottom: 16px">
      <div class="flex items-center" style="gap: 16px">
        <Input
          v-model:value="queryParams.keyword"
          allow-clear
          placeholder="请输入属性名称、标识符"
          style="width: 240px"
          @press-enter="handleQuery"
        />
        <Switch
          v-model:checked="autoRefresh"
          checked-children="定时刷新"
          class="ml-20px"
          un-checked-children="定时刷新"
        />
      </div>
      <Button.Group>
        <Button
          :type="viewMode === 'card' ? 'primary' : 'default'"
          @click="handleViewModeChange('card')"
        >
          <IconifyIcon icon="ep:grid" />
        </Button>
        <Button
          :type="viewMode === 'list' ? 'primary' : 'default'"
          @click="handleViewModeChange('list')"
        >
          <IconifyIcon icon="ep:list" />
        </Button>
      </Button.Group>
    </div>

    <!-- 分隔线 -->
    <Divider style="margin: 16px 0" />

    <!-- 卡片视图 -->
    <template v-if="viewMode === 'card'">
      <Row v-loading="loading" :gutter="16">
        <Col
          v-for="item in list"
          :key="item.identifier"
          :lg="6"
          :md="12"
          :sm="12"
          :xs="24"
          class="mb-4"
        >
          <Card
            :body-style="{ padding: '0' }"
            class="relative h-full overflow-hidden transition-colors"
          >
            <!-- 添加渐变背景层 -->
            <div
              class="pointer-events-none absolute left-0 right-0 top-0 h-12 bg-gradient-to-b from-muted to-transparent"
            ></div>
            <div class="relative p-4">
              <!-- 标题区域 -->
              <div class="mb-3 flex items-center">
                <div class="mr-2.5 flex items-center">
                  <IconifyIcon class="text-lg text-primary" icon="ep:cpu" />
                </div>
                <div class="flex-1 text-base font-bold">{{ item.name }}</div>
                <!-- 标识符 -->
                <div class="mr-2 inline-flex items-center">
                  <Tag color="blue" size="small">
                    {{ item.identifier }}
                  </Tag>
                </div>
                <!-- 数据类型标签 -->
                <div class="mr-2 inline-flex items-center">
                  <Tag size="small">
                    {{ item.dataType }}
                  </Tag>
                </div>
                <!-- 数据图标 - 可点击 -->
                <div
                  class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-blue-50"
                  @click="
                    openHistory(props.deviceId, item.identifier, item.dataType)
                  "
                >
                  <IconifyIcon
                    class="text-lg text-primary"
                    icon="ep:data-line"
                  />
                </div>
              </div>

              <!-- 信息区域 -->
              <div class="text-sm">
                <div class="mb-2.5 last:mb-0">
                  <span class="mr-2.5 text-muted-foreground">属性值</span>
                  <span class="font-bold text-foreground">
                    {{ formatValueWithUnit(item) }}
                  </span>
                </div>
                <div class="mb-2.5 last:mb-0">
                  <span class="mr-2.5 text-muted-foreground">更新时间</span>
                  <span class="text-sm text-foreground">
                    {{
                      item.updateTime ? formatDateTime(item.updateTime) : '-'
                    }}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </template>

    <!-- 列表视图 -->
    <Grid v-show="viewMode === 'list'">
      <template #value="{ row }">
        {{ formatValueWithUnit(row) }}
      </template>
      <template #updateTime="{ row }">
        {{ row.updateTime ? formatDateTime(row.updateTime) : '-' }}
      </template>
      <template #actions="{ row }">
        <Button
          type="link"
          @click="openHistory(props.deviceId, row.identifier, row.dataType)"
        >
          查看数据
        </Button>
      </template>
    </Grid>

    <!-- 表单弹窗：添加/修改 -->
    <DeviceDetailsThingModelPropertyHistory
      ref="historyRef"
      :device-id="props.deviceId"
    />
  </Page>
</template>
<style scoped>
/* 移除 a-row 的额外边距 */
:deep(.ant-row) {
  margin-right: -8px !important;
  margin-left: -8px !important;
}
</style>
