<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue';

import { Page } from '@vben/common-ui';
import { DICT_TYPE, IotDeviceMessageMethodEnum } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { useClipboard } from '@vueuse/core';
import {
  ElButton,
  ElMessage,
  ElOption,
  ElRadioButton,
  ElRadioGroup,
  ElSelect,
  ElSwitch,
  ElTag,
} from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getDeviceMessagePage } from '#/api/iot/device/device';
import { base64ToHex, IotRawMessageMethodEnum } from '#/views/iot/utils/raw';

const props = defineProps<{
  deviceId: number;
}>();

const queryParams = reactive({
  method: undefined,
  upstream: undefined,
  rawFilter: 'all' as 'all' | 'withoutRaw' | 'withRaw', // 原始帧筛选：全部、无原始帧、有原始帧
}); // 查询参数

const autoRefresh = ref(false); // 自动刷新开关
let autoRefreshTimer: any = null; // 自动刷新定时器
let refreshTimer: ReturnType<typeof setTimeout> | undefined; // 延迟刷新定时器

const { copy } = useClipboard({ legacy: true });

/** 消息方法选项 */
const methodOptions = computed(() => {
  return [
    ...Object.values(IotDeviceMessageMethodEnum),
    ...Object.values(IotRawMessageMethodEnum),
  ].map((item) => ({
    label: item.name,
    value: item.method,
  }));
});

/** 获取消息方法名称 */
function getMethodLabel(method?: string) {
  return methodOptions.value.find((item) => item.value === method)?.label;
}

/** 原始帧筛选转为 raw 参数：有原始帧 true、无原始帧 false、全部不传 */
function getRawFilter() {
  if (queryParams.rawFilter === 'all') {
    return undefined;
  }
  return queryParams.rawFilter === 'withRaw';
}

/** 获取原始帧（Base64）的 HEX；无法解析时原样展示 */
function getRawHex(row: Record<string, any>) {
  return base64ToHex(row.raw) ?? row.raw;
}

/** 复制原始帧的 HEX */
async function handleCopyRaw(row: Record<string, any>) {
  await copy(getRawHex(row));
  ElMessage.success('复制成功');
}

/** Grid 列定义 */
function useGridColumns(): VxeTableGridOptions<Record<string, any>>['columns'] {
  return [
    {
      field: 'ts',
      title: '时间',
      width: 160,
      slots: { default: 'ts' },
    },
    {
      field: 'upstream',
      title: '上行/下行',
      width: 100,
      slots: { default: 'upstream' },
    },
    {
      field: 'reply',
      title: '是否回复',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'requestId',
      title: '请求编号',
      width: 280,
      showOverflow: 'tooltip',
    },
    {
      field: 'method',
      title: '请求方法',
      width: 120,
      slots: { default: 'method' },
    },
    {
      field: 'params',
      title: '请求/响应数据',
      minWidth: 200,
      showOverflow: 'tooltip',
      slots: { default: 'params' },
    },
    {
      field: 'raw',
      title: '原始帧（HEX）',
      width: 260,
      showOverflow: 'tooltip',
      slots: { default: 'raw' },
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
          return await getDeviceMessagePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            deviceId: props.deviceId,
            method: queryParams.method,
            upstream: queryParams.upstream,
            raw: getRawFilter(),
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

/** 搜索操作 */
function handleQuery() {
  gridApi.query();
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
      handleQuery();
    }
  },
);

/** 组件卸载时清除定时器 */
onBeforeUnmount(() => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = undefined;
  }
});

/** 初始化 */
onMounted(() => {
  if (props.deviceId) {
    handleQuery();
  }
});

/** 刷新消息列表 */
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

/** 暴露方法给父组件 */
defineExpose({
  refresh,
});
</script>

<template>
  <Page auto-content-height>
    <!-- 搜索区域 -->
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <ElSelect
        v-model="queryParams.method"
        clearable
        placeholder="所有方法"
        style="width: 160px"
      >
        <ElOption
          v-for="item in methodOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </ElSelect>
      <ElSelect
        v-model="queryParams.upstream"
        clearable
        placeholder="上行/下行"
        style="width: 160px"
      >
        <ElOption label="上行" value="true" />
        <ElOption label="下行" value="false" />
      </ElSelect>
      <ElRadioGroup v-model="queryParams.rawFilter" @change="handleQuery">
        <ElRadioButton value="all">全部</ElRadioButton>
        <ElRadioButton value="withRaw">有原始帧</ElRadioButton>
        <ElRadioButton value="withoutRaw">无原始帧</ElRadioButton>
      </ElRadioGroup>
      <div class="flex gap-1">
        <ElButton type="primary" @click="handleQuery">
          <IconifyIcon icon="ep:search" class="mr-[5px]" /> 搜索
        </ElButton>
        <ElSwitch
          v-model="autoRefresh"
          active-text="定时刷新"
          inactive-text="定时刷新"
        />
      </div>
    </div>

    <!-- 消息列表 -->
    <Grid>
      <template #ts="{ row }">
        {{ formatDateTime(row.ts) }}
      </template>
      <template #upstream="{ row }">
        <ElTag :type="row.upstream ? 'primary' : 'success'">
          {{ row.upstream ? '上行' : '下行' }}
        </ElTag>
      </template>
      <template #method="{ row }">
        {{ getMethodLabel(row.method) }}
      </template>
      <template #params="{ row }">
        <span v-if="row.reply">
          {{ `{"code":${row.code},"msg":"${row.msg}","data":${row.data}\}` }}
        </span>
        <span v-else>{{ row.params }}</span>
      </template>
      <template #raw="{ row }">
        <!-- 与设备实际收发的原始字节；没有原始帧时不展示 -->
        <div v-if="row.raw" class="flex w-full items-center gap-1">
          <span
            :title="getRawHex(row)"
            class="min-w-0 flex-1 truncate font-mono"
          >
            {{ getRawHex(row) }}
          </span>
          <ElButton
            class="shrink-0"
            link
            size="small"
            type="primary"
            @click="handleCopyRaw(row)"
          >
            <IconifyIcon icon="lucide:copy" />
          </ElButton>
        </div>
      </template>
    </Grid>
  </Page>
</template>
