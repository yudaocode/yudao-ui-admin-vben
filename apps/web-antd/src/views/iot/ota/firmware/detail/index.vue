<script setup lang="ts">
import type { IoTOtaFirmwareApi } from '#/api/iot/ota/firmware';

import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { formatDate } from '@vben/utils';

import { Card, Descriptions } from 'ant-design-vue';

import { getOtaFirmware } from '#/api/iot/ota/firmware';
import { getOtaTaskRecordStatusStatistics } from '#/api/iot/ota/task/record';

import OtaTaskList from '../../modules/task/list.vue';
import UpgradeStatistics from '../../modules/upgrade-statistics.vue';

/** IoT OTA 固件详情 */
const route = useRoute();

const firmwareId = ref(Number(route.params.id));
const firmwareLoading = ref(false);
const firmware = ref<IoTOtaFirmwareApi.Firmware>({} as IoTOtaFirmwareApi.Firmware);

const firmwareStatisticsLoading = ref(false);
const firmwareStatistics = ref<Record<string, number>>({});

/** 获取固件信息 */
async function getFirmwareInfo() {
  firmwareLoading.value = true;
  try {
    firmware.value = await getOtaFirmware(firmwareId.value);
  } finally {
    firmwareLoading.value = false;
  }
}

/** 获取升级统计 */
async function getStatistics() {
  firmwareStatisticsLoading.value = true;
  try {
    firmwareStatistics.value = await getOtaTaskRecordStatusStatistics(
      firmwareId.value,
    );
  } finally {
    firmwareStatisticsLoading.value = false;
  }
}

/** 初始化 */
onMounted(() => {
  getFirmwareInfo();
  getStatistics();
});
</script>

<template>
  <div class="p-4">
    <!-- 固件信息 -->
    <!-- TODO @AI：是不是搞成 data.ts 那种方式 -->
    <!-- TODO @AI：拆成一个独立的组件？ -->
    <Card title="固件信息" class="mb-5" :loading="firmwareLoading">
      <Descriptions :column="3" bordered>
        <Descriptions.Item label="固件名称">
          {{ firmware?.name }}
        </Descriptions.Item>
        <Descriptions.Item label="所属产品">
          {{ firmware?.productName }}
        </Descriptions.Item>
        <Descriptions.Item label="固件版本">
          {{ firmware?.version }}
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">
          {{
            firmware?.createTime
              ? formatDate(firmware.createTime, 'YYYY-MM-DD HH:mm:ss')
              : '-'
          }}
        </Descriptions.Item>
        <Descriptions.Item label="固件描述" :span="2">
          {{ firmware?.description }}
        </Descriptions.Item>
      </Descriptions>
    </Card>

    <!-- 升级设备统计 -->
    <!-- TODO @AI：是不是搞个 detail/modules/upgrade-statistics；挪个目录？ -->
    <UpgradeStatistics
      :loading="firmwareStatisticsLoading"
      :statistics="firmwareStatistics"
    />

    <!-- 任务管理 -->
    <OtaTaskList
      v-if="firmware?.productId"
      :firmware-id="firmwareId"
      :product-id="firmware.productId"
      @success="getStatistics"
    />
  </div>
</template>
