<!-- 模拟设备 -->
<template>
  <ContentWrap>
    <a-row :gutter="20">
      <!-- 左侧指令调试区域 -->
      <a-col :span="12">
        <a-card>
          <a-tabs v-model:active-key="activeTab">
            <!-- 上行指令调试 -->
            <a-tab-pane key="upstream" tab="上行指令调试">
              <a-tabs v-if="activeTab === 'upstream'" v-model:active-key="upstreamTab">
                <!-- 属性上报 -->
                <a-tab-pane :key="IotDeviceMessageMethodEnum.PROPERTY_POST.method" tab="属性上报">
                  <ContentWrap>
                    <a-table :dataSource="propertyList" :columns="propertyColumns" :pagination="false">
                      <template #bodyCell="{ column, record }">
                        <template v-if="column.key === 'dataType'">
                          {{ record.property?.dataType ?? '-' }}
                        </template>
                        <template v-else-if="column.key === 'dataDefinition'">
                          <DataDefinition :data="record" />
                        </template>
                        <template v-else-if="column.key === 'value'">
                          <a-input
                            :value="getFormValue(record.identifier)"
                            @update:value="setFormValue(record.identifier, $event)"
                            placeholder="输入值"
                            size="small"
                          />
                        </template>
                      </template>
                    </a-table>
                    <div class="flex justify-between items-center mt-4">
                      <span class="text-sm text-gray-600">
                        设置属性值后，点击「发送属性上报」按钮
                      </span>
                      <a-button type="primary" @click="handlePropertyPost">发送属性上报</a-button>
                    </div>
                  </ContentWrap>
                </a-tab-pane>

                <!-- 事件上报 -->
                <a-tab-pane :key="IotDeviceMessageMethodEnum.EVENT_POST.method" tab="事件上报">
                  <ContentWrap>
                    <a-table :dataSource="eventList" :columns="eventColumns" :pagination="false">
                      <template #bodyCell="{ column, record }">
                        <template v-if="column.key === 'dataType'">
                          {{ record.event?.dataType ?? '-' }}
                        </template>
                        <template v-else-if="column.key === 'dataDefinition'">
                          <DataDefinition :data="record" />
                        </template>
                        <template v-else-if="column.key === 'value'">
                          <a-textarea
                            :value="getFormValue(record.identifier)"
                            @update:value="setFormValue(record.identifier, $event)"
                            :rows="3"
                            placeholder="输入事件参数（JSON格式）"
                            size="small"
                          />
                        </template>
                        <template v-else-if="column.key === 'action'">
                          <a-button type="primary" size="small" @click="handleEventPost(record)">
                            上报事件
                          </a-button>
                        </template>
                      </template>
                    </a-table>
                  </ContentWrap>
                </a-tab-pane>

                <!-- 状态变更 -->
                <a-tab-pane :key="IotDeviceMessageMethodEnum.STATE_UPDATE.method" tab="状态变更">
                  <ContentWrap>
                    <div class="flex gap-4">
                      <a-button type="primary" @click="handleDeviceState(DeviceStateEnum.ONLINE)">
                        设备上线
                      </a-button>
                      <a-button danger @click="handleDeviceState(DeviceStateEnum.OFFLINE)">
                        设备下线
                      </a-button>
                    </div>
                  </ContentWrap>
                </a-tab-pane>
              </a-tabs>
            </a-tab-pane>

            <!-- 下行指令调试 -->
            <a-tab-pane key="downstream" tab="下行指令调试">
              <a-tabs v-if="activeTab === 'downstream'" v-model:active-key="downstreamTab">
                <!-- 属性调试 -->
                <a-tab-pane :key="IotDeviceMessageMethodEnum.PROPERTY_SET.method" tab="属性设置">
                  <ContentWrap>
                    <a-table :dataSource="propertyList" :columns="propertyColumns" :pagination="false">
                      <template #bodyCell="{ column, record }">
                        <template v-if="column.key === 'dataType'">
                          {{ record.property?.dataType ?? '-' }}
                        </template>
                        <template v-else-if="column.key === 'dataDefinition'">
                          <DataDefinition :data="record" />
                        </template>
                        <template v-else-if="column.key === 'value'">
                          <a-input
                            :value="getFormValue(record.identifier)"
                            @update:value="setFormValue(record.identifier, $event)"
                            placeholder="输入值"
                            size="small"
                          />
                        </template>
                      </template>
                    </a-table>
                    <div class="flex justify-between items-center mt-4">
                      <span class="text-sm text-gray-600">
                        设置属性值后，点击「发送属性设置」按钮
                      </span>
                      <a-button type="primary" @click="handlePropertySet">发送属性设置</a-button>
                    </div>
                  </ContentWrap>
                </a-tab-pane>

                <!-- 服务调用 -->
                <a-tab-pane :key="IotDeviceMessageMethodEnum.SERVICE_INVOKE.method" tab="设备服务调用">
                  <ContentWrap>
                    <a-table :dataSource="serviceList" :columns="serviceColumns" :pagination="false">
                      <template #bodyCell="{ column, record }">
                        <template v-if="column.key === 'dataDefinition'">
                          <DataDefinition :data="record" />
                        </template>
                        <template v-else-if="column.key === 'value'">
                          <a-textarea
                            :value="getFormValue(record.identifier)"
                            @update:value="setFormValue(record.identifier, $event)"
                            :rows="3"
                            placeholder="输入服务参数（JSON格式）"
                            size="small"
                          />
                        </template>
                        <template v-else-if="column.key === 'action'">
                          <a-button
                            type="primary"
                            size="small"
                            @click="handleServiceInvoke(record)"
                          >
                            服务调用
                          </a-button>
                        </template>
                      </template>
                    </a-table>
                  </ContentWrap>
                </a-tab-pane>
              </a-tabs>
            </a-tab-pane>
          </a-tabs>
        </a-card>
      </a-col>

      <!-- 右侧设备日志区域 -->
      <a-col :span="12">
        <ContentWrap title="设备消息">
          <DeviceDetailsMessage v-if="device.id" ref="deviceMessageRef" :device-id="device.id" />
        </ContentWrap>
      </a-col>
    </a-row>
  </ContentWrap>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import type { ProductVO } from '#/api/iot/product/product'
import type { ThingModelData } from '#/api/iot/thingmodel'
import { DeviceApi, DeviceStateEnum } from '#/api/iot/device/device'
import type { DeviceVO } from '#/api/iot/device/device'
import DeviceDetailsMessage from './DeviceDetailsMessage.vue'
import { IotDeviceMessageMethodEnum, IoTThingModelTypeEnum } from '#/views/iot/utils/constants'

const props = defineProps<{
  product: ProductVO
  device: DeviceVO
  thingModelList: ThingModelData[]
}>()

 // 消息弹窗
const activeTab = ref('upstream') // 上行upstream、下行downstream
const upstreamTab = ref(IotDeviceMessageMethodEnum.PROPERTY_POST.method) // 上行子标签
const downstreamTab = ref(IotDeviceMessageMethodEnum.PROPERTY_SET.method) // 下行子标签
const deviceMessageRef = ref() // 设备消息组件引用
const deviceMessageRefreshDelay = 2000 // 延迟 N 秒，保证模拟上行的消息被处理

// 表单数据：存储用户输入的模拟值
const formData = ref<Record<string, string>>({})

// 根据类型过滤物模型数据
const getFilteredThingModelList = (type: number) => {
  return props.thingModelList.filter((item) => String(item.type) === String(type))
}

// 计算属性：属性列表
const propertyList = computed(() => getFilteredThingModelList(IoTThingModelTypeEnum.PROPERTY))

// 计算属性：事件列表
const eventList = computed(() => getFilteredThingModelList(IoTThingModelTypeEnum.EVENT))

// 计算属性：服务列表
const serviceList = computed(() => getFilteredThingModelList(IoTThingModelTypeEnum.SERVICE))

// 属性表格列定义
const propertyColumns = [
  {
    title: '功能名称',
    dataIndex: 'name',
    key: 'name',
    width: 120,
    align: 'center',
    fixed: 'left'
  },
  {
    title: '标识符',
    dataIndex: 'identifier',
    key: 'identifier',
    width: 120,
    align: 'center',
    fixed: 'left'
  },
  {
    title: '数据类型',
    key: 'dataType',
    width: 100,
    align: 'center'
  },
  {
    title: '数据定义',
    key: 'dataDefinition',
    minWidth: 200,
    align: 'left'
  },
  {
    title: '值',
    key: 'value',
    width: 150,
    align: 'center',
    fixed: 'right'
  }
]

// 事件表格列定义
const eventColumns = [
  {
    title: '功能名称',
    dataIndex: 'name',
    key: 'name',
    width: 120,
    align: 'center',
    fixed: 'left'
  },
  {
    title: '标识符',
    dataIndex: 'identifier',
    key: 'identifier',
    width: 120,
    align: 'center',
    fixed: 'left'
  },
  {
    title: '数据类型',
    key: 'dataType',
    width: 100,
    align: 'center'
  },
  {
    title: '数据定义',
    key: 'dataDefinition',
    minWidth: 200,
    align: 'left'
  },
  {
    title: '值',
    key: 'value',
    width: 200,
    align: 'center'
  },
  {
    title: '操作',
    key: 'action',
    width: 100,
    align: 'center',
    fixed: 'right'
  }
]

// 服务表格列定义
const serviceColumns = [
  {
    title: '服务名称',
    dataIndex: 'name',
    key: 'name',
    width: 120,
    align: 'center',
    fixed: 'left'
  },
  {
    title: '标识符',
    dataIndex: 'identifier',
    key: 'identifier',
    width: 120,
    align: 'center',
    fixed: 'left'
  },
  {
    title: '输入参数',
    key: 'dataDefinition',
    minWidth: 200,
    align: 'left'
  },
  {
    title: '参数值',
    key: 'value',
    width: 200,
    align: 'center'
  },
  {
    title: '操作',
    key: 'action',
    width: 100,
    align: 'center',
    fixed: 'right'
  }
]

// 获取表单值
const getFormValue = (identifier: string) => {
  return formData.value[identifier] || ''
}

// 设置表单值
const setFormValue = (identifier: string, value: string) => {
  formData.value[identifier] = value
}

// 属性上报
const handlePropertyPost = async () => {
  try {
    const params: Record<string, any> = {}
    propertyList.value.forEach((item) => {
      const value = formData.value[item.identifier!]
      if (value) {
        params[item.identifier!] = value
      }
    })

    if (Object.keys(params).length === 0) {
      message.warning({ content: '请至少输入一个属性值' })
      return
    }

    await DeviceApi.sendDeviceMessage({
      deviceId: props.device.id!,
      method: IotDeviceMessageMethodEnum.PROPERTY_POST.method,
      params
    })

    message.success({ content: '属性上报成功' })
    // 延迟刷新设备消息列表
    deviceMessageRef.value?.refresh(deviceMessageRefreshDelay)
  } catch (error) {
    message.error({ content: '属性上报失败' })
    console.error(error)
  }
}

// 事件上报
const handleEventPost = async (row: ThingModelData) => {
  try {
    const valueStr = formData.value[row.identifier!]
    let params: any = {}

    if (valueStr) {
      try {
        params = JSON.parse(valueStr)
      } catch (e) {
        message.error({ content: '事件参数格式错误，请输入有效的JSON格式' })
        return
      }
    }

    await DeviceApi.sendDeviceMessage({
      deviceId: props.device.id!,
      method: IotDeviceMessageMethodEnum.EVENT_POST.method,
      params: {
        identifier: row.identifier,
        params
      }
    })

    message.success({ content: '事件上报成功' })
    // 延迟刷新设备消息列表
    deviceMessageRef.value?.refresh(deviceMessageRefreshDelay)
  } catch (error) {
    message.error({ content: '事件上报失败' })
    console.error(error)
  }
}

// 状态变更
const handleDeviceState = async (state: number) => {
  try {
    await DeviceApi.sendDeviceMessage({
      deviceId: props.device.id!,
      method: IotDeviceMessageMethodEnum.STATE_UPDATE.method,
      params: { state }
    })

    message.success({ content: '状态变更成功' })
    // 延迟刷新设备消息列表
    deviceMessageRef.value?.refresh(deviceMessageRefreshDelay)
  } catch (error) {
    message.error({ content: '状态变更失败' })
    console.error(error)
  }
}

// 属性设置
const handlePropertySet = async () => {
  try {
    const params: Record<string, any> = {}
    propertyList.value.forEach((item) => {
      const value = formData.value[item.identifier!]
      if (value) {
        params[item.identifier!] = value
      }
    })

    if (Object.keys(params).length === 0) {
      message.warning({ content: '请至少输入一个属性值' })
      return
    }

    await DeviceApi.sendDeviceMessage({
      deviceId: props.device.id!,
      method: IotDeviceMessageMethodEnum.PROPERTY_SET.method,
      params
    })

    message.success({ content: '属性设置成功' })
    // 延迟刷新设备消息列表
    deviceMessageRef.value?.refresh(deviceMessageRefreshDelay)
  } catch (error) {
    message.error({ content: '属性设置失败' })
    console.error(error)
  }
}

// 服务调用
const handleServiceInvoke = async (row: ThingModelData) => {
  try {
    const valueStr = formData.value[row.identifier!]
    let params: any = {}

    if (valueStr) {
      try {
        params = JSON.parse(valueStr)
      } catch (e) {
        message.error({ content: '服务参数格式错误，请输入有效的JSON格式' })
        return
      }
    }

    await DeviceApi.sendDeviceMessage({
      deviceId: props.device.id!,
      method: IotDeviceMessageMethodEnum.SERVICE_INVOKE.method,
      params: {
        identifier: row.identifier,
        params
      }
    })

    message.success({ content: '服务调用成功' })
    // 延迟刷新设备消息列表
    deviceMessageRef.value?.refresh(deviceMessageRefreshDelay)
  } catch (error) {
    message.error({ content: '服务调用失败' })
    console.error(error)
  }
}
</script>
