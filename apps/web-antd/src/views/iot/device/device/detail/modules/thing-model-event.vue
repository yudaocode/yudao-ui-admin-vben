<!-- 设备事件管理 -->
<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ThingModelData } from '#/api/iot/thingmodel';

import { computed, onMounted, reactive, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Button, RangePicker, Select, Space, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getDeviceMessagePairPage } from '#/api/iot/device/device';
import {
  getEventTypeLabel,
  IotDeviceMessageMethodEnum,
  IoTThingModelTypeEnum,
} from '#/views/iot/utils/constants';

const props = defineProps<{
  deviceId: number;
  thingModelList: ThingModelData[];
}>();

/** 查询参数 */
const queryParams = reactive({
  identifier: '',
  times: undefined as [string, string] | undefined,
});

/** 事件类型的物模型数据 */
const eventThingModels = computed(() => {
  return props.thingModelList.filter(
    (item: ThingModelData) =>
      String(item.type) === String(IoTThingModelTypeEnum.EVENT),
  );
});

/** Grid 列定义 */
function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'reportTime',
      title: '上报时间',
      width: 180,
      slots: { default: 'reportTime' },
    },
    {
      field: 'identifier',
      title: '标识符',
      width: 160,
      slots: { default: 'identifier' },
    },
    {
      field: 'eventName',
      title: '事件名称',
      width: 160,
      slots: { default: 'eventName' },
    },
    {
      field: 'eventType',
      title: '事件类型',
      width: 100,
      slots: { default: 'eventType' },
    },
    {
      field: 'params',
      title: '输入参数',
      minWidth: 200,
      showOverflow: 'tooltip',
      slots: { default: 'params' },
    },
  ];
}

/** 创建 Grid 实例 */
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          if (!props.deviceId) {
            return { list: [], total: 0 };
          }
          return await getDeviceMessagePairPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            deviceId: props.deviceId,
            method: IotDeviceMessageMethodEnum.EVENT_POST.method,
            identifier: queryParams.identifier || undefined,
            times: queryParams.times,
          });
        },
      },
    },
    toolbarConfig: {
      refresh: false,
      search: false,
    },
    pagerConfig: {
      enabled: true,
    },
  } as VxeTableGridOptions,
});

/** 搜索按钮操作 */
function handleQuery() {
  gridApi.query();
}

/** 重置按钮操作 */
function resetQuery() {
  queryParams.identifier = '';
  queryParams.times = undefined;
  handleQuery();
}

/** 获取事件名称 */
function getEventName(identifier: string | undefined) {
  if (!identifier) return '-';
  const event = eventThingModels.value.find(
    (item: ThingModelData) => item.identifier === identifier,
  );
  return event?.name || identifier;
}

/** 获取事件类型 */
function getEventType(identifier: string | undefined) {
  if (!identifier) return '-';
  const event = eventThingModels.value.find(
    (item: ThingModelData) => item.identifier === identifier,
  );
  if (!event?.event?.type) return '-';
  return getEventTypeLabel(event.event.type) || '-';
}

/** 解析参数 */
function parseParams(params: string) {
  try {
    const parsed = JSON.parse(params);
    if (parsed.params) {
      return parsed.params;
    }
    return parsed;
  } catch {
    return {};
  }
}

/** 刷新列表 */
function refresh(delay = 0) {
  if (delay > 0) {
    setTimeout(() => gridApi.query(), delay);
  } else {
    gridApi.query();
  }
}

/** 监听设备标识变化 */
watch(
  () => props.deviceId,
  (newValue) => {
    if (newValue) {
      handleQuery();
    }
  },
);

/** 初始化 */
onMounted(() => {
  if (props.deviceId) {
    handleQuery();
  }
});

/** 暴露方法给父组件 */
defineExpose({
  refresh,
});
</script>

<template>
  <Page auto-content-height>
    <!-- 搜索区域 -->
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <div class="flex items-center gap-2">
        <span>标识符：</span>
        <Select
          v-model:value="queryParams.identifier"
          allow-clear
          placeholder="请选择事件标识符"
          style="width: 240px"
        >
          <Select.Option
            v-for="event in eventThingModels"
            :key="event.identifier"
            :value="event.identifier!"
          >
            {{ event.name }}({{ event.identifier }})
          </Select.Option>
        </Select>
      </div>
      <div class="flex items-center gap-2">
        <span>时间范围：</span>
        <RangePicker
          v-model:value="queryParams.times"
          format="YYYY-MM-DD HH:mm:ss"
          show-time
          style="width: 360px"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </div>
      <Space>
        <Button type="primary" @click="handleQuery">
          <template #icon>
            <IconifyIcon icon="ep:search" />
          </template>
          搜索
        </Button>
        <Button @click="resetQuery">
          <template #icon>
            <IconifyIcon icon="ep:refresh" />
          </template>
          重置
        </Button>
      </Space>
    </div>

    <!-- 事件列表 -->
    <Grid>
      <template #reportTime="{ row }">
        {{
          row.request?.reportTime ? formatDateTime(row.request.reportTime) : '-'
        }}
      </template>
      <template #identifier="{ row }">
        <Tag color="blue" size="small">
          {{ row.request?.identifier }}
        </Tag>
      </template>
      <template #eventName="{ row }">
        {{ getEventName(row.request?.identifier) }}
      </template>
      <template #eventType="{ row }">
        {{ getEventType(row.request?.identifier) }}
      </template>
      <template #params="{ row }">
        {{ parseParams(row.request?.params) }}
      </template>
    </Grid>
  </Page>
</template>
