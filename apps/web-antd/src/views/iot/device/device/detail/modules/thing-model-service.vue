<!-- 设备服务调用 -->
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
  getThingModelServiceCallTypeLabel,
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

/** 服务类型的物模型数据 */
const serviceThingModels = computed(() => {
  return props.thingModelList.filter(
    (item: ThingModelData) =>
      String(item.type) === String(IoTThingModelTypeEnum.SERVICE),
  );
});

/** Grid 列定义 */
function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'requestTime',
      title: '调用时间',
      width: 180,
      slots: { default: 'requestTime' },
    },
    {
      field: 'responseTime',
      title: '响应时间',
      width: 180,
      slots: { default: 'responseTime' },
    },
    {
      field: 'identifier',
      title: '标识符',
      width: 160,
      slots: { default: 'identifier' },
    },
    {
      field: 'serviceName',
      title: '服务名称',
      width: 160,
      slots: { default: 'serviceName' },
    },
    {
      field: 'callType',
      title: '调用方式',
      width: 100,
      slots: { default: 'callType' },
    },
    {
      field: 'inputParams',
      title: '输入参数',
      minWidth: 200,
      showOverflow: 'tooltip',
      slots: { default: 'inputParams' },
    },
    {
      field: 'outputParams',
      title: '输出参数',
      minWidth: 200,
      showOverflow: 'tooltip',
      slots: { default: 'outputParams' },
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
            method: IotDeviceMessageMethodEnum.SERVICE_INVOKE.method,
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

/** 获取服务名称 */
function getServiceName(identifier: string | undefined) {
  if (!identifier) return '-';
  const service = serviceThingModels.value.find(
    (item: ThingModelData) => item.identifier === identifier,
  );
  return service?.name || identifier;
}

/** 获取调用方式 */
function getCallType(identifier: string | undefined) {
  if (!identifier) return '-';
  const service = serviceThingModels.value.find(
    (item: ThingModelData) => item.identifier === identifier,
  );
  if (!service?.service?.callType) return '-';
  return getThingModelServiceCallTypeLabel(service.service.callType) || '-';
}

/** 解析参数 */
function parseParams(params: string) {
  if (!params) return '-';
  try {
    const parsed = JSON.parse(params);
    if (parsed.params) {
      return JSON.stringify(parsed.params, null, 2);
    }
    return JSON.stringify(parsed, null, 2);
  } catch {
    return params;
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
          placeholder="请选择服务标识符"
          style="width: 240px"
        >
          <Select.Option
            v-for="service in serviceThingModels"
            :key="service.identifier"
            :value="service.identifier!"
          >
            {{ service.name }}({{ service.identifier }})
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

    <!-- 服务调用列表 -->
    <Grid>
      <template #requestTime="{ row }">
        {{
          row.request?.reportTime ? formatDateTime(row.request.reportTime) : '-'
        }}
      </template>
      <template #responseTime="{ row }">
        {{ row.reply?.reportTime ? formatDateTime(row.reply.reportTime) : '-' }}
      </template>
      <template #identifier="{ row }">
        <Tag color="blue" size="small">
          {{ row.request?.identifier }}
        </Tag>
      </template>
      <template #serviceName="{ row }">
        {{ getServiceName(row.request?.identifier) }}
      </template>
      <template #callType="{ row }">
        {{ getCallType(row.request?.identifier) }}
      </template>
      <template #inputParams="{ row }">
        {{ parseParams(row.request?.params) }}
      </template>
      <template #outputParams="{ row }">
        <span v-if="row.reply">
          {{
            `{"code":${row.reply.code},"msg":"${row.reply.msg}","data":${row.reply.data}\}`
          }}
        </span>
        <span v-else>-</span>
      </template>
    </Grid>
  </Page>
</template>
