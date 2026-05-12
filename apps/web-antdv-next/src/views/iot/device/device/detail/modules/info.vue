<script lang="ts" setup>
import type { IotDeviceApi } from '#/api/iot/device/device';
import type { IotProductApi } from '#/api/iot/product/product';

import { computed, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  message,
  Modal,
} from 'ant-design-vue';

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

/** 是否有位置信息 */
const hasLocation = computed(() => {
  return !!(props.device.longitude && props.device.latitude);
});

/** 打开地图弹窗 */
function openMapDialog() {
  mapDialogRef.value?.open(props.device.longitude, props.device.latitude);
}

/** 复制到剪贴板 */
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    message.success('复制成功');
  } catch {
    message.error('复制失败');
  }
}

/** 打开设备认证信息弹框 */
async function handleAuthInfoDialogOpen() {
  if (!props.device.id) return;
  try {
    authInfo.value = await getDeviceAuthInfo(props.device.id);
    authDialogVisible.value = true;
  } catch {
    message.error('获取设备认证信息失败，请检查网络连接或联系管理员');
  }
}

/** 关闭设备认证信息弹框 */
function handleAuthInfoDialogClose() {
  authDialogVisible.value = false;
}
</script>

<template>
  <div>
    <Card title="设备信息">
      <Descriptions :column="3" bordered size="small">
        <Descriptions.Item label="产品名称">
          {{ product.name }}
        </Descriptions.Item>
        <Descriptions.Item label="ProductKey">
          {{ product.productKey }}
        </Descriptions.Item>
        <Descriptions.Item label="设备类型">
          <DictTag
            :type="DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE"
            :value="product.deviceType"
          />
        </Descriptions.Item>
        <Descriptions.Item label="DeviceName">
          {{ device.deviceName }}
        </Descriptions.Item>
        <Descriptions.Item label="备注名称">
          {{ device.nickname || '--' }}
        </Descriptions.Item>
        <Descriptions.Item label="当前状态">
          <DictTag :type="DICT_TYPE.IOT_DEVICE_STATE" :value="device.state" />
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">
          {{ formatDateTime(device.createTime) }}
        </Descriptions.Item>
        <Descriptions.Item label="激活时间">
          {{ formatDateTime(device.activeTime) }}
        </Descriptions.Item>
        <Descriptions.Item label="最后上线时间">
          {{ formatDateTime(device.onlineTime) }}
        </Descriptions.Item>
        <Descriptions.Item label="最后离线时间">
          {{ formatDateTime(device.offlineTime) }}
        </Descriptions.Item>
        <Descriptions.Item label="设备位置">
          <template v-if="hasLocation">
            <span class="mr-2">
              {{ device.longitude }}, {{ device.latitude }}
            </span>
            <Button type="link" size="small" @click="openMapDialog">
              <IconifyIcon icon="lucide:map-pin" class="mr-1" />
              查看地图
            </Button>
          </template>
          <span v-else class="text-gray-400">暂无位置信息</span>
        </Descriptions.Item>
        <Descriptions.Item label="MQTT 连接参数">
          <Button size="small" type="link" @click="handleAuthInfoDialogOpen">
            查看
          </Button>
        </Descriptions.Item>
      </Descriptions>
    </Card>

    <!-- 认证信息弹框 -->
    <Modal
      v-model:open="authDialogVisible"
      :footer="null"
      title="MQTT 连接参数"
      width="640px"
    >
      <Form :label-col="{ span: 6 }">
        <Form.Item label="clientId">
          <Input.Group compact>
            <Input
              v-model:value="authInfo.clientId"
              readonly
              style="width: calc(100% - 80px)"
            />
            <Button type="primary" @click="copyToClipboard(authInfo.clientId)">
              <IconifyIcon icon="lucide:copy" />
            </Button>
          </Input.Group>
        </Form.Item>
        <Form.Item label="username">
          <Input.Group compact>
            <Input
              v-model:value="authInfo.username"
              readonly
              style="width: calc(100% - 80px)"
            />
            <Button type="primary" @click="copyToClipboard(authInfo.username)">
              <IconifyIcon icon="lucide:copy" />
            </Button>
          </Input.Group>
        </Form.Item>
        <Form.Item label="password">
          <Input.Group compact>
            <Input
              v-model:value="authInfo.password"
              :type="authPasswordVisible ? 'text' : 'password'"
              readonly
              style="width: calc(100% - 160px)"
            />
            <Button
              type="primary"
              @click="authPasswordVisible = !authPasswordVisible"
            >
              <IconifyIcon
                :icon="authPasswordVisible ? 'lucide:eye-off' : 'lucide:eye'"
              />
            </Button>
            <Button type="primary" @click="copyToClipboard(authInfo.password)">
              <IconifyIcon icon="lucide:copy" />
            </Button>
          </Input.Group>
        </Form.Item>
      </Form>
      <div class="mt-4 text-right">
        <Button @click="handleAuthInfoDialogClose">关闭</Button>
      </div>
    </Modal>

    <!-- 地图弹窗 -->
    <MapDialog ref="mapDialogRef" />
  </div>
</template>
