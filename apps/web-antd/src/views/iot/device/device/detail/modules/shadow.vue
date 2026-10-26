<!-- 设备影子 -->
<script lang="ts" setup>
import type { TableColumnType } from 'ant-design-vue';

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
  Alert,
  Button,
  Collapse,
  DatePicker,
  Divider,
  Input,
  InputNumber,
  message,
  Select,
  Switch,
  Table,
} from 'ant-design-vue';

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

const propertyColumns: TableColumnType[] = [
  { title: '标识符', dataIndex: 'identifier', key: 'identifier', width: 140 },
  { title: '名称', dataIndex: 'name', key: 'name', width: 120 },
  { title: '数据类型', dataIndex: 'dataType', key: 'dataType', width: 100 },
  { title: '期望值 (desired)', key: 'desiredValue', minWidth: 150 },
  { title: '上报值 (reported)', key: 'reportedValue', minWidth: 150 },
  { title: '期望更新时间', key: 'desiredTime', width: 170 },
  { title: '上报更新时间', key: 'reportedTime', width: 170 },
]; // 属性对比表格列

const desiredColumns: TableColumnType[] = [
  { title: '标识符', dataIndex: 'identifier', key: 'identifier', width: 140 },
  { title: '名称', dataIndex: 'name', key: 'name', width: 120 },
  { title: '数据类型', key: 'dataType', width: 100 },
  { title: '期望值', key: 'value', minWidth: 200 },
]; // 下发期望表格列

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
async function handleStatusChange(checked: boolean | number | string) {
  if (statusUpdating.value) {
    return;
  }
  const status = checked as number;
  statusUpdating.value = true;
  try {
    await updateDeviceShadowStatus({ deviceId: props.deviceId, status });
    shadow.value.status = status;
    message.success('影子开关已更新');
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

/** 布尔、枚举的可选值：保留物模型定义的原始类型 */
function getSelectOptions(row: ThingModelApi.ThingModel) {
  return (row.property?.dataSpecsList || []).map((item) => ({
    label: `${item.name}（${item.value}）`,
    value: item.value,
  }));
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
        message.error(`【${item.name}】需选择合法的时间`);
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
      message.error(`【${item.name}】需填写整数`);
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
      message.error(
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
    message.warning('请至少填写一个期望值');
    return;
  }
  updating.value = true;
  try {
    await updateDeviceShadowDesired({ deviceId: props.deviceId, desired });
    message.success('期望状态已下发');
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
    message.success('影子已重置');
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
function getRowClassName(record: IotDeviceShadowApi.ShadowProperty) {
  return isDelta(record) ? 'shadow-delta-row' : '';
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
          <Switch
            v-model:checked="shadowEnabled"
            :checked-value="CommonStatusEnum.ENABLE"
            :disabled="!canUpdate"
            :loading="statusUpdating"
            :un-checked-value="CommonStatusEnum.DISABLE"
            @change="handleStatusChange"
          />
        </span>
      </div>
      <div class="flex gap-2">
        <Button :loading="loading" @click="loadShadow">
          <IconifyIcon class="mr-1" icon="ant-design:reload-outlined" />
          刷新
        </Button>
        <Button
          v-if="canUpdate"
          :loading="resetting"
          danger
          @click="handleReset"
        >
          重置影子
        </Button>
      </div>
    </div>

    <!-- 属性对比表 -->
    <Table
      :columns="propertyColumns"
      :data-source="shadow.properties"
      :loading="loading"
      :pagination="false"
      :row-class-name="getRowClassName"
      :scroll="{ x: 'max-content' }"
      row-key="identifier"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'desiredValue'">
          <span :class="{ 'font-bold text-orange-500': isDelta(record) }">
            {{ formatValue(record.desiredValue) }}
          </span>
        </template>
        <template v-else-if="column.key === 'reportedValue'">
          <span :class="{ 'font-bold text-orange-500': isDelta(record) }">
            {{ formatValue(record.reportedValue) }}
          </span>
        </template>
        <template v-else-if="column.key === 'desiredTime'">
          {{ formatTime(record.desiredTime) }}
        </template>
        <template v-else-if="column.key === 'reportedTime'">
          {{ formatTime(record.reportedTime) }}
        </template>
      </template>
    </Table>

    <!-- 下发期望 -->
    <template v-if="canUpdate">
      <Divider orientation="left">下发期望状态</Divider>
      <Alert
        v-if="isDisabled"
        class="!mb-4"
        message="影子已关闭，无法下发期望状态；开启影子开关后再下发"
        show-icon
        type="warning"
      />
      <Table
        :columns="desiredColumns"
        :data-source="writableProperties"
        :pagination="false"
        :scroll="{ x: 'max-content' }"
        row-key="identifier"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'dataType'">
            {{ record.property?.dataType ?? '-' }}
          </template>
          <template v-else-if="column.key === 'value'">
            <!-- 布尔、枚举：按物模型定义选择取值 -->
            <Select
              v-if="getDesiredInputType(record) === 'select'"
              v-model:value="desiredForm[record.identifier]"
              :options="getSelectOptions(record)"
              allow-clear
              class="w-full"
              placeholder="选择期望值"
              size="small"
            />
            <!-- 数值：int 取整，float / double 保留输入精度 -->
            <InputNumber
              v-else-if="getDesiredInputType(record) === 'number'"
              v-model:value="desiredForm[record.identifier]"
              :precision="
                record.property?.dataType === IoTDataSpecsDataTypeEnum.INT
                  ? 0
                  : undefined
              "
              class="!w-full"
              placeholder="输入期望值"
              size="small"
            />
            <!-- 时间：毫秒时间戳 -->
            <DatePicker
              v-else-if="getDesiredInputType(record) === 'date'"
              v-model:value="desiredForm[record.identifier]"
              class="w-full"
              placeholder="选择期望时间"
              show-time
              size="small"
              value-format="x"
            />
            <!-- 结构体、数组：输入 JSON -->
            <Input
              v-else-if="getDesiredInputType(record) === 'json'"
              v-model:value="desiredForm[record.identifier]"
              :placeholder="
                record.property?.dataType === IoTDataSpecsDataTypeEnum.ARRAY
                  ? '输入 JSON 数组'
                  : '输入 JSON 对象'
              "
              size="small"
            />
            <!-- 文本等：输入字符串 -->
            <Input
              v-else
              v-model:value="desiredForm[record.identifier]"
              placeholder="输入期望值"
              size="small"
            />
          </template>
        </template>
      </Table>
      <div class="mt-4 flex justify-end">
        <Button
          :disabled="isDisabled"
          :loading="updating"
          type="primary"
          @click="handleUpdateDesired"
        >
          下发期望状态
        </Button>
      </div>
    </template>

    <!-- 原始 JSON -->
    <Collapse class="mt-4">
      <Collapse.Panel key="raw" header="原始影子文档 (JSON)">
        <pre
          class="m-0 max-h-96 overflow-auto rounded bg-[#f5f5f5] p-4 text-xs dark:bg-[#1a1a1a]"
          v-text="rawJson"
        ></pre>
      </Collapse.Panel>
    </Collapse>
  </ContentWrap>
</template>

<style scoped>
:deep(.shadow-delta-row) > td {
  background-color: rgb(250 173 20 / 10%) !important;
}
</style>
