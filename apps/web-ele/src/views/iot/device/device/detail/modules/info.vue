<script lang="ts" setup>
import type { IotDeviceApi } from '#/api/iot/device/device';
import type { IotProductApi } from '#/api/iot/product/product';

import { computed, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import {
  ElButton,
  ElCard,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
} from 'element-plus';

import { getDeviceAuthInfo } from '#/api/iot/device/device';
import { DictTag } from '#/components/dict-tag';
import { MapDialog } from '#/components/map';

interface Props {
  device: IotDeviceApi.Device;
  product: IotProductApi.Product;
}

const props = defineProps<Props>();

const authDialogVisible = ref(false);
const authPasswordVisible = ref(false);
const authInfo = ref<IotDeviceApi.DeviceAuthInfoRespVO>(
  {} as IotDeviceApi.DeviceAuthInfoRespVO,
);
const mapDialogRef = ref<InstanceType<typeof MapDialog>>();

/** 是否有位置信息（合法经纬度 0 不应视为空） */
const hasLocation = computed(() => {
  return props.device.longitude != null && props.device.latitude != null;
});

/** 打开地图弹窗 */
function openMapDialog() {
  mapDialogRef.value?.open(props.device.longitude, props.device.latitude);
}

/** 复制到剪贴板 */
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success('复制成功');
  } catch {
    ElMessage.error('复制失败');
  }
}

/** 打开设备认证信息弹框 */
async function handleAuthInfoDialogOpen() {
  if (!props.device.id) return;
  try {
    authInfo.value = await getDeviceAuthInfo(props.device.id);
    authDialogVisible.value = true;
  } catch {
    ElMessage.error('获取设备认证信息失败，请检查网络连接或联系管理员');
  }
}

/** 关闭设备认证信息弹框 */
function handleAuthInfoDialogClose() {
  authDialogVisible.value = false;
}
</script>

<template>
  <div>
    <ElCard>
      <template #header>设备信息</template>
      <ElDescriptions :column="3" border size="small">
        <ElDescriptionsItem label="产品名称">
          {{ product.name }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="ProductKey">
          {{ product.productKey }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="设备类型">
          <DictTag
            :type="DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE"
            :value="product.deviceType"
          />
        </ElDescriptionsItem>
        <ElDescriptionsItem label="DeviceName">
          {{ device.deviceName }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="备注名称">
          {{ device.nickname || '--' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="当前状态">
          <DictTag :type="DICT_TYPE.IOT_DEVICE_STATE" :value="device.state" />
        </ElDescriptionsItem>
        <ElDescriptionsItem label="创建时间">
          {{ formatDateTime(device.createTime) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="激活时间">
          {{ formatDateTime(device.activeTime) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="最后上线时间">
          {{ formatDateTime(device.onlineTime) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="最后离线时间">
          {{ formatDateTime(device.offlineTime) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="设备位置">
          <template v-if="hasLocation">
            <span class="mr-2">
              {{ device.longitude }}, {{ device.latitude }}
            </span>
            <ElButton type="primary" link size="small" @click="openMapDialog">
              <IconifyIcon icon="lucide:map-pin" class="mr-1" />
              查看地图
            </ElButton>
          </template>
          <span v-else class="text-gray-400">暂无位置信息</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="MQTT 连接参数">
          <ElButton
            size="small"
            type="primary"
            link
            @click="handleAuthInfoDialogOpen"
          >
            查看
          </ElButton>
        </ElDescriptionsItem>
      </ElDescriptions>
    </ElCard>

    <!-- 认证信息弹框 -->
    <ElDialog
      v-model="authDialogVisible"
      title="MQTT 连接参数"
      width="640px"
      :show-close="true"
    >
      <ElForm label-width="120px">
        <ElFormItem label="clientId">
          <div class="flex w-full gap-1">
            <ElInput v-model="authInfo.clientId" readonly class="flex-1" />
            <ElButton
              type="primary"
              @click="copyToClipboard(authInfo.clientId)"
            >
              <IconifyIcon icon="lucide:copy" />
            </ElButton>
          </div>
        </ElFormItem>
        <ElFormItem label="username">
          <div class="flex w-full gap-1">
            <ElInput v-model="authInfo.username" readonly class="flex-1" />
            <ElButton
              type="primary"
              @click="copyToClipboard(authInfo.username)"
            >
              <IconifyIcon icon="lucide:copy" />
            </ElButton>
          </div>
        </ElFormItem>
        <ElFormItem label="password">
          <div class="flex w-full gap-1">
            <ElInput
              v-model="authInfo.password"
              :type="authPasswordVisible ? 'text' : 'password'"
              readonly
              class="flex-1"
            />
            <ElButton
              type="primary"
              @click="authPasswordVisible = !authPasswordVisible"
            >
              <IconifyIcon
                :icon="authPasswordVisible ? 'lucide:eye-off' : 'lucide:eye'"
              />
            </ElButton>
            <ElButton
              type="primary"
              @click="copyToClipboard(authInfo.password)"
            >
              <IconifyIcon icon="lucide:copy" />
            </ElButton>
          </div>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="handleAuthInfoDialogClose">关闭</ElButton>
      </template>
    </ElDialog>

    <!-- 地图弹窗 -->
    <MapDialog ref="mapDialogRef" />
  </div>
</template>
