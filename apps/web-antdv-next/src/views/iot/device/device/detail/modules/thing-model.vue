<!-- 设备物模型：设备属性、事件管理、服务调用 -->
<script lang="ts" setup>
import type { ThingModelApi } from '#/api/iot/thingmodel';

import { ref } from 'vue';

import { ContentWrap } from '@vben/common-ui';

import { Tabs } from 'antdv-next';

import DeviceDetailsThingModelEvent from './thing-model-event.vue';
import DeviceDetailsThingModelProperty from './thing-model-property.vue';
import DeviceDetailsThingModelService from './thing-model-service.vue';

const props = defineProps<{
  deviceId: number;
  thingModelList: ThingModelApi.ThingModel[];
}>();

const activeTab = ref('property'); // 默认选中设备属性
const thingModelTabItems = [
  { key: 'property', label: '设备属性（运行状态）' },
  { key: 'event', label: '设备事件上报' },
  { key: 'service', label: '设备服务调用' },
];
</script>
<template>
  <ContentWrap>
    <Tabs
      v-model:active-key="activeTab"
      :items="thingModelTabItems"
      class="!h-auto !p-0"
    >
      <template #contentRender="{ item }">
        <DeviceDetailsThingModelProperty
          v-if="item.key === 'property' && activeTab === 'property'"
          :device-id="deviceId"
        />
        <DeviceDetailsThingModelEvent
          v-else-if="item.key === 'event' && activeTab === 'event'"
          :device-id="props.deviceId"
          :thing-model-list="props.thingModelList"
        />
        <DeviceDetailsThingModelService
          v-else-if="item.key === 'service' && activeTab === 'service'"
          :device-id="deviceId"
          :thing-model-list="props.thingModelList"
        />
      </template>
    </Tabs>
  </ContentWrap>
</template>
