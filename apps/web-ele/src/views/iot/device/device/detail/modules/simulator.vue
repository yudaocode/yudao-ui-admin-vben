<!-- 模拟设备 -->
<script lang="ts" setup>
import type { IotDeviceApi } from '#/api/iot/device/device';
import type { IotProductApi } from '#/api/iot/product/product';
import type { ThingModelApi } from '#/api/iot/thingmodel';

import { computed, ref, watch } from 'vue';

import { ContentWrap } from '@vben/common-ui';
import {
  DeviceStateEnum,
  IoTDataSpecsDataTypeEnum,
  IotDeviceMessageMethodEnum,
  IoTThingModelTypeEnum,
} from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import {
  ElButton,
  ElCard,
  ElCol,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElRow,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTabPane,
  ElTabs,
} from 'element-plus';

import { sendDeviceMessage } from '#/api/iot/device/device';

import DataDefinition from '../../../../thingmodel/modules/components/data-definition.vue';
import DeviceDetailsMessage from './message.vue';

const props = defineProps<{
  device: IotDeviceApi.Device;
  product: IotProductApi.Product;
  thingModelList: ThingModelApi.ThingModel[];
}>();

// 消息弹窗
const activeTab = ref('upstream'); // 上行upstream、下行downstream
const upstreamTab = ref(IotDeviceMessageMethodEnum.PROPERTY_POST.method); // 上行子标签
const downstreamTab = ref(IotDeviceMessageMethodEnum.PROPERTY_SET.method); // 下行子标签
const deviceMessageRef = ref(); // 设备消息组件引用
const deviceMessageRefreshDelay = 2000; // 延迟 N 秒，保证模拟上行的消息被处理

// 折叠状态
const debugCollapsed = ref(false); // 指令调试区域折叠状态
const messageCollapsed = ref(false); // 设备消息区域折叠状态

// 表单数据：存储用户输入的模拟值
const formData = ref<Record<string, any>>({});

// 根据类型过滤物模型数据
const getFilteredThingModelList = (type: number) => {
  return props.thingModelList.filter(
    (item) => String(item.type) === String(type),
  );
};

// 计算属性：属性列表
const propertyList = computed(() =>
  getFilteredThingModelList(IoTThingModelTypeEnum.PROPERTY),
);

// 计算属性：事件列表
const eventList = computed(() =>
  getFilteredThingModelList(IoTThingModelTypeEnum.EVENT),
);

// 计算属性：服务列表
const serviceList = computed(() =>
  getFilteredThingModelList(IoTThingModelTypeEnum.SERVICE),
);

// 获取表单值
function getFormValue(identifier: string) {
  return formData.value[identifier] ?? '';
}

// 设置表单值
function setFormValue(identifier: string, value: any) {
  formData.value[identifier] = value;
}

/** 获取属性数据类型 */
function getPropertyDataType(row: ThingModelApi.ThingModel) {
  return row.property?.dataType;
}

/** 判断属性是否为数值类型 */
function isNumberProperty(row: ThingModelApi.ThingModel) {
  return [
    IoTDataSpecsDataTypeEnum.DOUBLE,
    IoTDataSpecsDataTypeEnum.FLOAT,
    IoTDataSpecsDataTypeEnum.INT,
  ].includes(getPropertyDataType(row) as any);
}

/** 判断属性是否使用下拉选项 */
function isSelectProperty(row: ThingModelApi.ThingModel) {
  return [
    IoTDataSpecsDataTypeEnum.BOOL,
    IoTDataSpecsDataTypeEnum.ENUM,
  ].includes(getPropertyDataType(row) as any);
}

/** 获取属性选项 */
function getPropertyOptions(row: ThingModelApi.ThingModel) {
  const list = row.property?.dataSpecsList || [];
  if (list.length > 0) {
    return list.map((item: any) => ({
      label: item.name || item.label || String(item.value),
      value: String(item.value),
    }));
  }
  if (getPropertyDataType(row) === IoTDataSpecsDataTypeEnum.BOOL) {
    return [
      { label: '真 (true)', value: 'true' },
      { label: '假 (false)', value: 'false' },
    ];
  }
  return [];
}

/** 获取物模型选项原始值 */
function getMatchedPropertyOption(row: ThingModelApi.ThingModel, value: any) {
  return row.property?.dataSpecsList?.find(
    (item: any) => String(item.value) === String(value),
  );
}

/** 按物模型数据类型转换属性值 */
function normalizePropertyValue(row: ThingModelApi.ThingModel, value: any) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const dataType = getPropertyDataType(row);
  if (isNumberProperty(row)) {
    return Number(value);
  }
  if (
    [IoTDataSpecsDataTypeEnum.BOOL, IoTDataSpecsDataTypeEnum.ENUM].includes(
      dataType as any,
    )
  ) {
    const option = getMatchedPropertyOption(row, value);
    if (option) {
      return option.value;
    }
  }
  if (dataType === IoTDataSpecsDataTypeEnum.BOOL) {
    if (String(value) === 'true') {
      return true;
    }
    if (String(value) === 'false') {
      return false;
    }
  }
  return value;
}

// 属性上报
async function handlePropertyPost() {
  try {
    const params: Record<string, any> = {};
    propertyList.value.forEach((item) => {
      const value = normalizePropertyValue(item, formData.value[item.identifier!]);
      if (value !== undefined) {
        params[item.identifier!] = value;
      }
    });

    if (Object.keys(params).length === 0) {
      ElMessage.warning('请至少输入一个属性值');
      return;
    }

    await sendDeviceMessage({
      deviceId: props.device.id!,
      method: IotDeviceMessageMethodEnum.PROPERTY_POST.method,
      params,
    });

    ElMessage.success('属性上报成功');
    // 延迟刷新设备消息列表
    deviceMessageRef.value?.refresh(deviceMessageRefreshDelay);
  } catch (error) {
    ElMessage.error('属性上报失败');
    console.error(error);
  }
}

// 事件上报
async function handleEventPost(row: ThingModelApi.ThingModel) {
  try {
    const valueStr = formData.value[row.identifier!];
    let eventValue: any;

    if (valueStr === undefined || valueStr === null || valueStr === '') {
      ElMessage.warning('请输入事件参数');
      return;
    }
    try {
      eventValue = JSON.parse(valueStr);
    } catch {
      ElMessage.error('事件参数格式错误，请输入有效的JSON格式');
      return;
    }

    // 与后端 IotDeviceEventPostReqDTO 对齐 ：{ identifier, value, time }
    await sendDeviceMessage({
      deviceId: props.device.id!,
      method: IotDeviceMessageMethodEnum.EVENT_POST.method,
      params: {
        identifier: row.identifier,
        value: eventValue,
        time: Date.now(),
      },
    });

    ElMessage.success('事件上报成功');
    // 延迟刷新设备消息列表
    deviceMessageRef.value?.refresh(deviceMessageRefreshDelay);
  } catch (error) {
    ElMessage.error('事件上报失败');
    console.error(error);
  }
}

// 状态变更
async function handleDeviceState(state: number) {
  try {
    await sendDeviceMessage({
      deviceId: props.device.id!,
      method: IotDeviceMessageMethodEnum.STATE_UPDATE.method,
      params: { state },
    });

    ElMessage.success('状态变更成功');
    // 延迟刷新设备消息列表
    deviceMessageRef.value?.refresh(deviceMessageRefreshDelay);
  } catch (error) {
    ElMessage.error('状态变更失败');
    console.error(error);
  }
}

// 属性设置
async function handlePropertySet() {
  try {
    const params: Record<string, any> = {};
    propertyList.value.forEach((item) => {
      const value = normalizePropertyValue(item, formData.value[item.identifier!]);
      if (value !== undefined) {
        params[item.identifier!] = value;
      }
    });

    if (Object.keys(params).length === 0) {
      ElMessage.warning('请至少输入一个属性值');
      return;
    }

    await sendDeviceMessage({
      deviceId: props.device.id!,
      method: IotDeviceMessageMethodEnum.PROPERTY_SET.method,
      params,
    });

    ElMessage.success('属性设置成功');
    // 延迟刷新设备消息列表
    deviceMessageRef.value?.refresh(deviceMessageRefreshDelay);
  } catch (error) {
    ElMessage.error('属性设置失败');
    console.error(error);
  }
}

// 服务调用
async function handleServiceInvoke(row: ThingModelApi.ThingModel) {
  try {
    const valueStr = formData.value[row.identifier!];
    let inputParams: any = {};

    if (valueStr === undefined || valueStr === null || valueStr === '') {
      ElMessage.warning('请输入服务参数');
      return;
    }
    try {
      inputParams = JSON.parse(valueStr);
    } catch {
      ElMessage.error('服务参数格式错误，请输入有效的JSON格式');
      return;
    }
    if (
      typeof inputParams !== 'object' ||
      inputParams === null ||
      Array.isArray(inputParams)
    ) {
      ElMessage.error('服务参数必须是 JSON 对象');
      return;
    }

    // 与后端 IotDeviceServiceInvokeReqDTO 对齐 ：{ identifier, inputParams }
    await sendDeviceMessage({
      deviceId: props.device.id!,
      method: IotDeviceMessageMethodEnum.SERVICE_INVOKE.method,
      params: {
        identifier: row.identifier,
        inputParams,
      },
    });

    ElMessage.success('服务调用成功');
    // 延迟刷新设备消息列表
    deviceMessageRef.value?.refresh(deviceMessageRefreshDelay);
  } catch (error) {
    ElMessage.error('服务调用失败');
    console.error(error);
  }
}

/** 切换调试方法时清空输入，避免不同方法之间串台提交 */
watch([activeTab, upstreamTab, downstreamTab], () => {
  formData.value = {};
});
</script>

<template>
  <ContentWrap>
    <ElRow :gutter="16">
      <!-- 左侧：指令调试区域 -->
      <ElCol :lg="12" :md="24" :sm="24" :xl="12" :xs="24">
        <ElCard class="simulator-tabs h-full">
          <template #header>
            <div class="flex items-center justify-between">
              <span>指令调试</span>
              <ElButton
                size="small"
                text
                @click="debugCollapsed = !debugCollapsed"
              >
                <IconifyIcon v-if="!debugCollapsed" icon="lucide:chevron-up" />
                <IconifyIcon v-if="debugCollapsed" icon="lucide:chevron-down" />
              </ElButton>
            </div>
          </template>
          <div v-show="!debugCollapsed">
            <ElTabs v-model="activeTab" size="small">
              <!-- 上行指令调试 -->
              <ElTabPane name="upstream" label="上行指令调试">
                <ElTabs
                  v-if="activeTab === 'upstream'"
                  v-model="upstreamTab"
                  size="small"
                >
                  <!-- 属性上报 -->
                  <ElTabPane
                    :name="IotDeviceMessageMethodEnum.PROPERTY_POST.method"
                    label="属性上报"
                  >
                    <ContentWrap>
                      <ElTable
                        :data="propertyList"
                        :max-height="300"
                        size="small"
                      >
                        <ElTableColumn
                          label="功能名称"
                          prop="name"
                          width="100"
                          fixed="left"
                        />
                        <ElTableColumn
                          label="标识符"
                          prop="identifier"
                          width="120"
                          fixed="left"
                        />
                        <ElTableColumn label="数据类型" width="90">
                          <template #default="{ row }">
                            {{ row.property?.dataType ?? '-' }}
                          </template>
                        </ElTableColumn>
                        <ElTableColumn label="数据定义" min-width="150">
                          <template #default="{ row }">
                            <DataDefinition :data="row" />
                          </template>
                        </ElTableColumn>
                        <ElTableColumn label="值" width="180" fixed="right">
                          <template #default="{ row }">
                            <ElInputNumber
                              v-if="isNumberProperty(row)"
                              :model-value="getFormValue(row.identifier)"
                              placeholder="输入值"
                              size="small"
                              class="w-full"
                              @update:model-value="
                                setFormValue(row.identifier, $event)
                              "
                            />
                            <ElSelect
                              v-else-if="isSelectProperty(row)"
                              :model-value="getFormValue(row.identifier)"
                              placeholder="请选择值"
                              size="small"
                              class="w-full"
                              @update:model-value="
                                setFormValue(row.identifier, $event)
                              "
                            >
                              <ElOption
                                v-for="option in getPropertyOptions(row)"
                                :key="option.value"
                                :label="option.label"
                                :value="option.value"
                              />
                            </ElSelect>
                            <ElInput
                              v-else
                              :model-value="getFormValue(row.identifier)"
                              placeholder="输入值"
                              size="small"
                              @update:model-value="
                                setFormValue(row.identifier, $event)
                              "
                            />
                          </template>
                        </ElTableColumn>
                      </ElTable>
                      <div class="mt-4 flex items-center justify-between">
                        <span class="text-sm text-gray-600">
                          设置属性值后，点击「发送属性上报」按钮
                        </span>
                        <ElButton type="primary" @click="handlePropertyPost">
                          发送属性上报
                        </ElButton>
                      </div>
                    </ContentWrap>
                  </ElTabPane>

                  <!-- 事件上报 -->
                  <ElTabPane
                    :name="IotDeviceMessageMethodEnum.EVENT_POST.method"
                    label="事件上报"
                  >
                    <ContentWrap>
                      <ElTable :data="eventList" :max-height="300" size="small">
                        <ElTableColumn
                          label="功能名称"
                          prop="name"
                          width="100"
                          fixed="left"
                        />
                        <ElTableColumn
                          label="标识符"
                          prop="identifier"
                          width="120"
                          fixed="left"
                        />
                        <ElTableColumn label="数据类型" width="90">
                          <template #default="{ row }">
                            {{ row.event?.dataType ?? '-' }}
                          </template>
                        </ElTableColumn>
                        <ElTableColumn label="数据定义" min-width="150">
                          <template #default="{ row }">
                            <DataDefinition :data="row" />
                          </template>
                        </ElTableColumn>
                        <ElTableColumn label="值" width="180">
                          <template #default="{ row }">
                            <ElInput
                              type="textarea"
                              :rows="3"
                              :model-value="getFormValue(row.identifier)"
                              placeholder="输入事件参数（JSON格式）"
                              size="small"
                              @update:model-value="
                                setFormValue(row.identifier, $event)
                              "
                            />
                          </template>
                        </ElTableColumn>
                        <ElTableColumn label="操作" width="100" fixed="right">
                          <template #default="{ row }">
                            <ElButton
                              size="small"
                              type="primary"
                              @click="handleEventPost(row)"
                            >
                              上报事件
                            </ElButton>
                          </template>
                        </ElTableColumn>
                      </ElTable>
                    </ContentWrap>
                  </ElTabPane>

                  <!-- 状态变更 -->
                  <ElTabPane
                    :name="IotDeviceMessageMethodEnum.STATE_UPDATE.method"
                    label="状态变更"
                  >
                    <ContentWrap>
                      <div class="flex gap-4">
                        <ElButton
                          type="primary"
                          @click="handleDeviceState(DeviceStateEnum.ONLINE)"
                        >
                          设备上线
                        </ElButton>
                        <ElButton
                          type="danger"
                          @click="handleDeviceState(DeviceStateEnum.OFFLINE)"
                        >
                          设备下线
                        </ElButton>
                      </div>
                    </ContentWrap>
                  </ElTabPane>
                </ElTabs>
              </ElTabPane>

              <!-- 下行指令调试 -->
              <ElTabPane name="downstream" label="下行指令调试">
                <ElTabs
                  v-if="activeTab === 'downstream'"
                  v-model="downstreamTab"
                  size="small"
                >
                  <!-- 属性调试 -->
                  <ElTabPane
                    :name="IotDeviceMessageMethodEnum.PROPERTY_SET.method"
                    label="属性设置"
                  >
                    <ContentWrap>
                      <ElTable
                        :data="propertyList"
                        :max-height="300"
                        size="small"
                      >
                        <ElTableColumn
                          label="功能名称"
                          prop="name"
                          width="100"
                          fixed="left"
                        />
                        <ElTableColumn
                          label="标识符"
                          prop="identifier"
                          width="120"
                          fixed="left"
                        />
                        <ElTableColumn label="数据类型" width="90">
                          <template #default="{ row }">
                            {{ row.property?.dataType ?? '-' }}
                          </template>
                        </ElTableColumn>
                        <ElTableColumn label="数据定义" min-width="150">
                          <template #default="{ row }">
                            <DataDefinition :data="row" />
                          </template>
                        </ElTableColumn>
                        <ElTableColumn label="值" width="180" fixed="right">
                          <template #default="{ row }">
                            <ElInputNumber
                              v-if="isNumberProperty(row)"
                              :model-value="getFormValue(row.identifier)"
                              placeholder="输入值"
                              size="small"
                              class="w-full"
                              @update:model-value="
                                setFormValue(row.identifier, $event)
                              "
                            />
                            <ElSelect
                              v-else-if="isSelectProperty(row)"
                              :model-value="getFormValue(row.identifier)"
                              placeholder="请选择值"
                              size="small"
                              class="w-full"
                              @update:model-value="
                                setFormValue(row.identifier, $event)
                              "
                            >
                              <ElOption
                                v-for="option in getPropertyOptions(row)"
                                :key="option.value"
                                :label="option.label"
                                :value="option.value"
                              />
                            </ElSelect>
                            <ElInput
                              v-else
                              :model-value="getFormValue(row.identifier)"
                              placeholder="输入值"
                              size="small"
                              @update:model-value="
                                setFormValue(row.identifier, $event)
                              "
                            />
                          </template>
                        </ElTableColumn>
                      </ElTable>
                      <div class="mt-4 flex items-center justify-between">
                        <span class="text-sm text-gray-600">
                          设置属性值后，点击「发送属性设置」按钮
                        </span>
                        <ElButton type="primary" @click="handlePropertySet">
                          发送属性设置
                        </ElButton>
                      </div>
                    </ContentWrap>
                  </ElTabPane>

                  <!-- 服务调用 -->
                  <ElTabPane
                    :name="IotDeviceMessageMethodEnum.SERVICE_INVOKE.method"
                    label="设备服务调用"
                  >
                    <ContentWrap>
                      <ElTable
                        :data="serviceList"
                        :max-height="300"
                        size="small"
                      >
                        <ElTableColumn
                          label="服务名称"
                          prop="name"
                          width="100"
                          fixed="left"
                        />
                        <ElTableColumn
                          label="标识符"
                          prop="identifier"
                          width="120"
                          fixed="left"
                        />
                        <ElTableColumn label="输入参数" min-width="150">
                          <template #default="{ row }">
                            <DataDefinition :data="row" />
                          </template>
                        </ElTableColumn>
                        <ElTableColumn label="参数值" width="180">
                          <template #default="{ row }">
                            <ElInput
                              type="textarea"
                              :rows="3"
                              :model-value="getFormValue(row.identifier)"
                              placeholder="输入服务参数（JSON格式）"
                              size="small"
                              @update:model-value="
                                setFormValue(row.identifier, $event)
                              "
                            />
                          </template>
                        </ElTableColumn>
                        <ElTableColumn label="操作" width="100" fixed="right">
                          <template #default="{ row }">
                            <ElButton
                              size="small"
                              type="primary"
                              @click="handleServiceInvoke(row)"
                            >
                              服务调用
                            </ElButton>
                          </template>
                        </ElTableColumn>
                      </ElTable>
                    </ContentWrap>
                  </ElTabPane>
                </ElTabs>
              </ElTabPane>
            </ElTabs>
          </div>
        </ElCard>
      </ElCol>

      <!-- 右侧：设备消息区域 -->
      <ElCol :lg="12" :md="24" :sm="24" :xl="12" :xs="24">
        <ElCard class="h-full">
          <template #header>
            <div class="flex items-center justify-between">
              <span>设备消息</span>
              <ElButton
                size="small"
                text
                @click="messageCollapsed = !messageCollapsed"
              >
                <IconifyIcon
                  v-if="!messageCollapsed"
                  icon="lucide:chevron-up"
                />
                <IconifyIcon
                  v-if="messageCollapsed"
                  icon="lucide:chevron-down"
                />
              </ElButton>
            </div>
          </template>
          <div v-show="!messageCollapsed">
            <DeviceDetailsMessage
              v-if="device.id"
              ref="deviceMessageRef"
              :device-id="device.id"
            />
          </div>
        </ElCard>
      </ElCol>
    </ElRow>
  </ContentWrap>
</template>
