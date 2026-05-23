<script lang="ts" setup>
import type { IoTOtaFirmwareApi } from '#/api/iot/ota/firmware';

import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import { getOtaFirmware } from '#/api/iot/ota/firmware';
import { getOtaTaskRecordStatusStatistics } from '#/api/iot/ota/task/record';

import OtaTaskList from '../../task/modules/list.vue';
import UpgradeStatistics from '../../task/modules/statistics.vue';
import FirmwareInfo from './modules/info.vue';

const route = useRoute();

const firmwareId = ref(Number(route.params.id));
const firmwareLoading = ref(false);
const firmware = ref<IoTOtaFirmwareApi.Firmware>();

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
  <Page>
    <!-- 固件信息 -->
    <FirmwareInfo :firmware="firmware" :loading="firmwareLoading" />
    <!-- 升级设备统计 -->
    <div class="mt-4">
      <UpgradeStatistics
        :loading="firmwareStatisticsLoading"
        :statistics="firmwareStatistics"
      />
    </div>
    <!-- 任务管理 -->
    <div v-if="firmware?.productId" class="mt-4">
      <OtaTaskList
        :firmware-id="firmwareId"
        :product-id="firmware.productId"
        @success="getStatistics"
      />
    </div>
  </Page>
</template>
