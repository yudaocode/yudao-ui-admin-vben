<!-- 设备物模型：设备属性、事件管理、服务调用 -->
<script lang="ts" setup>
import type { ThingModelApi } from '#/api/iot/thingmodel';

import { ref } from 'vue';

import { ContentWrap } from '@vben/common-ui';

import { ElTabPane, ElTabs } from 'element-plus';

import DeviceDetailsThingModelEvent from './thing-model-event.vue';
import DeviceDetailsThingModelProperty from './thing-model-property.vue';
import DeviceDetailsThingModelService from './thing-model-service.vue';

const props = defineProps<{
  deviceId: number;
  thingModelList: ThingModelApi.ThingModel[];
}>();

const activeTab = ref('property'); // 默认选中设备属性
</script>
<template>
  <ContentWrap>
    <ElTabs v-model="activeTab" class="!h-auto !p-0">
      <ElTabPane name="property" label="设备属性（运行状态）">
        <DeviceDetailsThingModelProperty
          v-if="activeTab === 'property'"
          :device-id="deviceId"
        />
      </ElTabPane>
      <ElTabPane name="event" label="设备事件上报">
        <DeviceDetailsThingModelEvent
          v-if="activeTab === 'event'"
          :device-id="props.deviceId"
          :thing-model-list="props.thingModelList"
        />
      </ElTabPane>
      <ElTabPane name="service" label="设备服务调用">
        <DeviceDetailsThingModelService
          v-if="activeTab === 'service'"
          :device-id="deviceId"
          :thing-model-list="props.thingModelList"
        />
      </ElTabPane>
    </ElTabs>
  </ContentWrap>
</template>
