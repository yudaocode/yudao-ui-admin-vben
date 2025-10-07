<!-- 设备物模型：设备属性、事件管理、服务调用 -->
<template>
  <ContentWrap>
    <a-tabs v-model:active-key="activeTab" class="thing-model-tabs">
      <a-tab-pane key="property" tab="设备属性（运行状态）">
        <DeviceDetailsThingModelProperty :device-id="deviceId" />
      </a-tab-pane>
      <a-tab-pane key="event" tab="设备事件上报">
        <DeviceDetailsThingModelEvent
          :device-id="props.deviceId"
          :thing-model-list="props.thingModelList"
        />
      </a-tab-pane>
      <a-tab-pane key="service" tab="设备服务调用">
        <DeviceDetailsThingModelService
          :device-id="deviceId"
          :thing-model-list="props.thingModelList"
        />
      </a-tab-pane>
    </a-tabs>
  </ContentWrap>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { ContentWrap } from '@vben/common-ui'
import type { ThingModelData } from '#/api/iot/thingmodel'
import DeviceDetailsThingModelProperty from './DeviceDetailsThingModelProperty.vue'
import DeviceDetailsThingModelEvent from './DeviceDetailsThingModelEvent.vue'
import DeviceDetailsThingModelService from './DeviceDetailsThingModelService.vue'

const props = defineProps<{
  deviceId: number
  thingModelList: ThingModelData[]
}>()

const activeTab = ref('property') // 默认选中设备属性
</script>

<style scoped>
.thing-model-tabs :deep(.ant-tabs-content) {
  height: auto !important;
}

.thing-model-tabs :deep(.ant-tabs-tabpane) {
  padding: 0 !important;
}
</style>
