<!-- 设备服务调用 -->
<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ThingModelApi } from '#/api/iot/thingmodel';

import { computed, onBeforeUnmount, onMounted, reactive, watch } from 'vue';

import { Page } from '@vben/common-ui';
import {
  getThingModelServiceCallTypeLabel,
  IotDeviceMessageMethodEnum,
  IoTThingModelTypeEnum,
} from '@vben/constants';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import {
  ElButton,
  ElDatePicker,
  ElOption,
  ElSelect,
  ElTag,
} from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getDeviceMessagePairPage } from '#/api/iot/device/device';

const props = defineProps<{
  deviceId: number;
  thingModelList: ThingModelApi.ThingModel[];
}>();

/** 查询参数 */
const queryParams = reactive({
  identifier: '',
  times: undefined as [string, string] | undefined,
});
let refreshTimer: ReturnType<typeof setTimeout> | undefined; // 延迟刷新定时器

/** 服务类型的物模型数据 */
const serviceThingModels = computed(() => {
  return props.thingModelList.filter(
    (item: ThingModelApi.ThingModel) =>
      String(item.type) === String(IoTThingModelTypeEnum.SERVICE),
  );
});

/** Grid 列定义 */
function useGridColumns(): VxeTableGridOptions<Record<string, any>>['columns'] {
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
    (item: ThingModelApi.ThingModel) => item.identifier === identifier,
  );
  return service?.name || identifier;
}

/** 获取调用方式 */
function getCallType(identifier: string | undefined) {
  if (!identifier) return '-';
  const service = serviceThingModels.value.find(
    (item: ThingModelApi.ThingModel) => item.identifier === identifier,
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
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = undefined;
  }
  if (delay > 0) {
    refreshTimer = setTimeout(() => {
      gridApi.query();
      refreshTimer = undefined;
    }, delay);
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

/** 组件卸载时清除延迟刷新定时器 */
onBeforeUnmount(() => {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = undefined;
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
        <ElSelect
          v-model="queryParams.identifier"
          clearable
          placeholder="请选择服务标识符"
          style="width: 240px"
        >
          <ElOption
            v-for="service in serviceThingModels"
            :key="service.identifier"
            :value="service.identifier!"
            :label="`${service.name}(${service.identifier})`"
          />
        </ElSelect>
      </div>
      <div class="flex items-center gap-2">
        <span>时间范围：</span>
        <ElDatePicker
          v-model="queryParams.times"
          type="datetimerange"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          style="width: 360px"
        />
      </div>
      <div class="flex gap-1">
        <ElButton type="primary" @click="handleQuery">
          <IconifyIcon icon="ep:search" class="mr-1" />
          搜索
        </ElButton>
        <ElButton @click="resetQuery">
          <IconifyIcon icon="ep:refresh" class="mr-1" />
          重置
        </ElButton>
      </div>
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
        <ElTag type="primary" size="small">
          {{ row.request?.identifier }}
        </ElTag>
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
