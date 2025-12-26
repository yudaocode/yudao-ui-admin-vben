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
  Col,
  Descriptions,
  Form,
  Input,
  message,
  Modal,
  Row,
} from 'ant-design-vue';

import { getDeviceAuthInfo } from '#/api/iot/device/device';
import { DictTag } from '#/components/dict-tag';

interface Props {
  device: IotDeviceApi.Device;
  product: IotProductApi.Product;
}

const props = defineProps<Props>();

const authDialogVisible = ref(false);
const authPasswordVisible = ref(false);
const authInfo = ref<IotDeviceApi.DeviceAuthInfo>(
  {} as IotDeviceApi.DeviceAuthInfo,
);

/** 控制地图显示的标志 */
const showMap = computed(() => {
  return !!(props.device.longitude && props.device.latitude);
});

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
    <Row :gutter="16">
      <!-- 左侧设备信息 -->
      <Col :span="12">
        <Card class="h-full">
          <template #title>
            <div class="flex items-center">
              <!-- TODO @haohao：图标尽量使用中立的，这样 ep 版本呢好迁移 -->
              <IconifyIcon class="mr-2 text-primary" icon="ep:info-filled" />
              <span>设备信息</span>
            </div>
          </template>
          <Descriptions :column="1" bordered size="small">
            <Descriptions.Item label="产品名称">
              {{ props.product.name }}
            </Descriptions.Item>
            <Descriptions.Item label="ProductKey">
              {{ props.product.productKey }}
            </Descriptions.Item>
            <Descriptions.Item label="设备类型">
              <DictTag
                :type="DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE"
                :value="props.product.deviceType"
              />
            </Descriptions.Item>
            <Descriptions.Item label="定位类型">
              <DictTag
                :type="DICT_TYPE.IOT_LOCATION_TYPE"
                :value="props.product.locationType"
              />
            </Descriptions.Item>
            <Descriptions.Item label="DeviceName">
              {{ props.device.deviceName }}
            </Descriptions.Item>
            <Descriptions.Item label="备注名称">
              {{ props.device.nickname || '--' }}
            </Descriptions.Item>
            <Descriptions.Item label="当前状态">
              <DictTag
                :type="DICT_TYPE.IOT_DEVICE_STATE"
                :value="props.device.state"
              />
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {{ formatDateTime(props.device.createTime) }}
            </Descriptions.Item>
            <Descriptions.Item label="激活时间">
              {{ formatDateTime(props.device.activeTime) }}
            </Descriptions.Item>
            <Descriptions.Item label="最后上线时间">
              {{ formatDateTime(props.device.onlineTime) }}
            </Descriptions.Item>
            <Descriptions.Item label="最后离线时间">
              {{ formatDateTime(props.device.offlineTime) }}
            </Descriptions.Item>
            <Descriptions.Item label="MQTT 连接参数">
              <Button
                size="small"
                type="link"
                @click="handleAuthInfoDialogOpen"
              >
                查看
              </Button>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>

      <!-- 右侧地图 -->
      <Col :span="12">
        <Card class="h-full">
          <template #title>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <!-- TODO @haohao：图标尽量使用中立的，这样 ep 版本呢好迁移 -->
                <IconifyIcon class="mr-2 text-primary" icon="ep:location" />
                <span>设备位置</span>
              </div>
              <div class="text-sm text-gray-500">
                最后上线：{{ formatDateTime(props.device.onlineTime) || '--' }}
              </div>
            </div>
          </template>
          <div class="h-[500px] w-full">
            <div
              v-if="showMap"
              class="flex h-full w-full items-center justify-center rounded bg-gray-100"
            >
              <span class="text-gray-400">地图组件</span>
            </div>
            <div
              v-else
              class="flex h-full w-full items-center justify-center rounded bg-gray-50 text-gray-400"
            >
              <!-- TODO @haohao：图标尽量使用中立的，这样 ep 版本呢好迁移 -->
              <IconifyIcon class="mr-2" icon="ep:warning" />
              <span>暂无位置信息</span>
            </div>
          </div>
        </Card>
      </Col>
    </Row>

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
  </div>
</template>
