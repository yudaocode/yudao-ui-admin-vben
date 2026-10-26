<!-- 设备影子 -->
<script lang="ts" setup>
import type { IotDeviceShadowApi } from '#/api/iot/device/shadow';
import type { ThingModelApi } from '#/api/iot/thingmodel';

import { computed, onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, ContentWrap } from '@vben/common-ui';
import {
  CommonStatusEnum,
  IoTDataSpecsDataTypeEnum,
  IoTThingModelAccessModeEnum,
  IoTThingModelTypeEnum,
} from '@vben/constants';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime, fromTimestampPickerValue, isEqual } from '@vben/utils';

import {
  ElAlert,
  ElButton,
  ElCollapse,
  ElCollapseItem,
  ElDatePicker,
  ElDivider,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect,
  ElSwitch,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import {
  getDeviceShadow,
  resetDeviceShadow,
  updateDeviceShadowDesired,
  updateDeviceShadowStatus,
} from '#/api/iot/device/shadow';

const props = defineProps<{
  deviceId: number;
  thingModelList: ThingModelApi.ThingModel[];
}>();

const { hasAccessByCodes } = useAccess();

const loading = ref(false); // 加载中
const updating = ref(false); // 下发期望中
const resetting = ref(false); // 重置中
const statusUpdating = ref(false); // 开关更新中
const shadow = ref<IotDeviceShadowApi.Shadow>({
  version: 0,
  shadowTime: 0,
  status: CommonStatusEnum.ENABLE,
  properties: [],
  desired: {},
  reported: {},
  metadata: {},
}); // 设备影子
const shadowEnabled = ref(CommonStatusEnum.ENABLE); // 开关的展示值
const desiredForm = ref<Record<string, any>>({}); // 期望值表单，只保存用户填写的属性

const canUpdate = computed(() =>
  hasAccessByCodes(['iot:device:shadow-update']),
); // 是否有影子修改权限
const isDisabled = computed(
  () => shadow.value.status === CommonStatusEnum.DISABLE,
); // 影子是否已关闭

/** 可写属性列表（引导填写 desired） */
const writableProperties = computed(() => {
  return props.thingModelList.filter((item) => {
    if (item.type !== IoTThingModelTypeEnum.PROPERTY) {
      return false;
    }
    const accessMode = item.property?.accessMode;
    return (
      accessMode === IoTThingModelAccessModeEnum.READ_WRITE.value ||
      accessMode === IoTThingModelAccessModeEnum.WRITE_ONLY.value
    );
  });
});

/** 原始影子文档 */
const rawJson = computed(() =>
  JSON.stringify(
    {
      state: { desired: shadow.value.desired, reported: shadow.value.reported },
      metadata: shadow.value.metadata,
      version: shadow.value.version,
      timestamp: shadow.value.shadowTime,
    },
    null,
    2,
  ),
);

/** 加载设备影子 */
async function loadShadow() {
  loading.value = true;
  try {
    shadow.value = await getDeviceShadow(props.deviceId);
    shadowEnabled.value = shadow.value.status ?? CommonStatusEnum.ENABLE;
  } finally {
    loading.value = false;
  }
}

/** 切换影子开关：失败时回滚到最近一次成功的状态 */
async function handleStatusChange(value: boolean | number | string) {
  if (statusUpdating.value) {
    return;
  }
  const status = value as number;
  statusUpdating.value = true;
  try {
    await updateDeviceShadowStatus({ deviceId: props.deviceId, status });
    shadow.value.status = status;
    ElMessage.success('影子开关已更新');
  } catch {
    shadowEnabled.value = shadow.value.status;
  } finally {
    statusUpdating.value = false;
  }
}

/** 期望值的输入方式，按物模型数据类型区分 */
function getDesiredInputType(row: ThingModelApi.ThingModel) {
  switch (row.property?.dataType) {
    case IoTDataSpecsDataTypeEnum.ARRAY:
    case IoTDataSpecsDataTypeEnum.STRUCT: {
      return 'json';
    }
    case IoTDataSpecsDataTypeEnum.BOOL:
    case IoTDataSpecsDataTypeEnum.ENUM: {
      return 'select';
    }
    case IoTDataSpecsDataTypeEnum.DATE: {
      return 'date';
    }
    case IoTDataSpecsDataTypeEnum.DOUBLE:
    case IoTDataSpecsDataTypeEnum.FLOAT:
    case IoTDataSpecsDataTypeEnum.INT: {
      return 'number';
    }
    default: {
      return 'text';
    }
  }
}

/** 构建期望状态：只包含已填写的属性；校验失败时提示并返回 undefined */
function buildDesired() {
  const desired: Record<string, any> = {};
  for (const item of writableProperties.value) {
    const identifier = item.identifier as string;
    const value = desiredForm.value[identifier];
    if (value === undefined || value === null || value === '') {
      continue;
    }
    const inputType = getDesiredInputType(item);
    // 日期：value-format="x" 返回字符串，转为毫秒时间戳
    if (inputType === 'date') {
      const timestamp = fromTimestampPickerValue(value);
      if (timestamp === undefined) {
        ElMessage.error(`【${item.name}】需选择合法的时间`);
        return undefined;
      }
      desired[identifier] = timestamp;
      continue;
    }
    // 整数：不允许小数
    if (
      item.property?.dataType === IoTDataSpecsDataTypeEnum.INT &&
      !Number.isInteger(value)
    ) {
      ElMessage.error(`【${item.name}】需填写整数`);
      return undefined;
    }
    if (inputType !== 'json') {
      desired[identifier] = value;
      continue;
    }
    // 结构体、数组：解析为 JSON 对象、数组
    const isArray = item.property?.dataType === IoTDataSpecsDataTypeEnum.ARRAY;
    let json: any;
    try {
      json = JSON.parse(value);
    } catch {
      json = undefined;
    }
    const isObject =
      json !== null && typeof json === 'object' && !Array.isArray(json);
    if (isArray ? !Array.isArray(json) : !isObject) {
      ElMessage.error(
        `【${item.name}】需填写合法的 JSON ${isArray ? '数组' : '对象'}`,
      );
      return undefined;
    }
    desired[identifier] = json;
  }
  return desired;
}

/** 下发期望状态：成功后清空表单并刷新；失败时保留输入 */
async function handleUpdateDesired() {
  const desired = buildDesired();
  if (!desired) {
    return;
  }
  if (Object.keys(desired).length === 0) {
    ElMessage.warning('请至少填写一个期望值');
    return;
  }
  updating.value = true;
  try {
    await updateDeviceShadowDesired({ deviceId: props.deviceId, desired });
    ElMessage.success('期望状态已下发');
    desiredForm.value = {};
    await loadShadow();
  } finally {
    updating.value = false;
  }
}

/** 重置影子 */
async function handleReset() {
  await confirm(
    '确认重置该设备的影子文档？此操作将清空 desired、reported 和 metadata，版本号归 0。',
  );
  resetting.value = true;
  try {
    await resetDeviceShadow(props.deviceId);
    ElMessage.success('影子已重置');
    await loadShadow();
  } finally {
    resetting.value = false;
  }
}

/** 期望值与上报值不一致（结构体、数组按内容深比较；参数只取两个值，兼容表格插槽的行类型） */
function isDelta(row: { desiredValue?: any; reportedValue?: any }) {
  if (row.desiredValue === undefined || row.desiredValue === null) {
    return false;
  }
  return !isEqual(row.desiredValue, row.reportedValue);
}

/** 差异行高亮 */
function getRowClassName({ row }: { row: IotDeviceShadowApi.ShadowProperty }) {
  return isDelta(row) ? 'shadow-delta-row' : '';
}

/** 格式化属性值 */
function formatValue(value: any) {
  if (value === undefined || value === null) {
    return '-';
  }
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

/** 格式化 epoch 秒 */
function formatTime(epochSecond?: number) {
  return epochSecond ? formatDateTime(epochSecond * 1000) : '-';
}

/** 初始化 */
onMounted(() => {
  if (hasAccessByCodes(['iot:device:shadow-query'])) {
    loadShadow();
  }
});
</script>

<template>
  <ContentWrap>
    <!-- 顶部信息栏 -->
    <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600">
        <span>
          版本号：<b>{{ shadow.version ?? 0 }}</b>
        </span>
        <span>最后更新：{{ formatTime(shadow.shadowTime) }}</span>
        <span class="flex items-center gap-2">
          影子开关：
          <ElSwitch
            v-model="shadowEnabled"
            :active-value="CommonStatusEnum.ENABLE"
            :disabled="!canUpdate"
            :inactive-value="CommonStatusEnum.DISABLE"
            :loading="statusUpdating"
            @change="handleStatusChange"
          />
        </span>
      </div>
      <div class="flex gap-2">
        <ElButton :loading="loading" @click="loadShadow">
          <IconifyIcon class="mr-1" icon="ep:refresh" />
          刷新
        </ElButton>
        <ElButton
          v-if="canUpdate"
          :loading="resetting"
          plain
          type="danger"
          @click="handleReset"
        >
          重置影子
        </ElButton>
      </div>
    </div>

    <!-- 属性对比表 -->
    <ElTable
      v-loading="loading"
      :data="shadow.properties"
      :row-class-name="getRowClassName"
      row-key="identifier"
      show-overflow-tooltip
      size="small"
      stripe
    >
      <ElTableColumn label="标识符" prop="identifier" width="140" />
      <ElTableColumn label="名称" prop="name" width="120" />
      <ElTableColumn label="数据类型" prop="dataType" width="100" />
      <ElTableColumn label="期望值 (desired)" min-width="150">
        <template #default="{ row }">
          <span :class="{ 'font-bold text-orange-500': isDelta(row) }">
            {{ formatValue(row.desiredValue) }}
          </span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="上报值 (reported)" min-width="150">
        <template #default="{ row }">
          <span :class="{ 'font-bold text-orange-500': isDelta(row) }">
            {{ formatValue(row.reportedValue) }}
          </span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="期望更新时间" width="170">
        <template #default="{ row }">
          {{ formatTime(row.desiredTime) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="上报更新时间" width="170">
        <template #default="{ row }">
          {{ formatTime(row.reportedTime) }}
        </template>
      </ElTableColumn>
    </ElTable>

    <!-- 下发期望 -->
    <template v-if="canUpdate">
      <ElDivider content-position="left">下发期望状态</ElDivider>
      <ElAlert
        v-if="isDisabled"
        :closable="false"
        class="!mb-4"
        show-icon
        title="影子已关闭，无法下发期望状态；开启影子开关后再下发"
        type="warning"
      />
      <ElTable
        :data="writableProperties"
        row-key="identifier"
        show-overflow-tooltip
        size="small"
        stripe
      >
        <ElTableColumn label="标识符" prop="identifier" width="140" />
        <ElTableColumn label="名称" prop="name" width="120" />
        <ElTableColumn label="数据类型" width="100">
          <template #default="{ row }">
            {{ row.property?.dataType ?? '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="期望值" min-width="200">
          <template #default="{ row }">
            <!-- 布尔、枚举：按物模型定义选择取值 -->
            <ElSelect
              v-if="getDesiredInputType(row) === 'select'"
              v-model="desiredForm[row.identifier]"
              class="!w-full"
              clearable
              placeholder="选择期望值"
              size="small"
            >
              <ElOption
                v-for="item in row.property?.dataSpecsList || []"
                :key="item.value"
                :label="`${item.name}（${item.value}）`"
                :value="item.value"
              />
            </ElSelect>
            <!-- 数值：int 取整，float / double 保留输入精度 -->
            <ElInputNumber
              v-else-if="getDesiredInputType(row) === 'number'"
              v-model="desiredForm[row.identifier]"
              :controls="false"
              :precision="
                row.property?.dataType === IoTDataSpecsDataTypeEnum.INT
                  ? 0
                  : undefined
              "
              class="!w-full"
              placeholder="输入期望值"
              size="small"
            />
            <!-- 时间：毫秒时间戳 -->
            <ElDatePicker
              v-else-if="getDesiredInputType(row) === 'date'"
              v-model="desiredForm[row.identifier]"
              class="!w-full"
              placeholder="选择期望时间"
              size="small"
              type="datetime"
              value-format="x"
            />
            <!-- 结构体、数组：输入 JSON -->
            <ElInput
              v-else-if="getDesiredInputType(row) === 'json'"
              v-model="desiredForm[row.identifier]"
              :placeholder="
                row.property?.dataType === IoTDataSpecsDataTypeEnum.ARRAY
                  ? '输入 JSON 数组'
                  : '输入 JSON 对象'
              "
              size="small"
            />
            <!-- 文本等：输入字符串 -->
            <ElInput
              v-else
              v-model="desiredForm[row.identifier]"
              placeholder="输入期望值"
              size="small"
            />
          </template>
        </ElTableColumn>
      </ElTable>
      <div class="mt-4 flex justify-end">
        <ElButton
          :disabled="isDisabled"
          :loading="updating"
          type="primary"
          @click="handleUpdateDesired"
        >
          下发期望状态
        </ElButton>
      </div>
    </template>

    <!-- 原始 JSON -->
    <ElCollapse class="mt-4">
      <ElCollapseItem name="raw" title="原始影子文档 (JSON)">
        <pre
          class="m-0 max-h-96 overflow-auto rounded bg-[#f5f5f5] p-4 text-xs dark:bg-[#1a1a1a]"
          v-text="rawJson"
        ></pre>
      </ElCollapseItem>
    </ElCollapse>
  </ContentWrap>
</template>

<style scoped>
:deep(.shadow-delta-row) > td.el-table__cell {
  background-color: var(--el-color-warning-light-9) !important;
}
</style>
