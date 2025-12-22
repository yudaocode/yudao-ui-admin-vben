<!-- 设备配置 -->
<script lang="ts" setup>
import type { IotDeviceApi } from '#/api/iot/device/device';

import { computed, ref, watchEffect } from 'vue';

import { Alert, Button, message, Textarea } from 'ant-design-vue';

import { sendDeviceMessage, updateDevice } from '#/api/iot/device/device';
import { IotDeviceMessageMethodEnum } from '#/views/iot/utils/constants';

defineOptions({ name: 'DeviceDetailConfig' });

const props = defineProps<{
  device: IotDeviceApi.Device;
}>();

const emit = defineEmits<{
  (e: 'success'): void; // 定义 success 事件，不需要参数
}>();

const loading = ref(false); // 加载中
const pushLoading = ref(false); // 推送加载中
const saveLoading = ref(false); // 保存加载中
const config = ref<any>({}); // 只存储 config 字段
const configString = ref(''); // 用于编辑器的字符串格式

/** 监听 props.device 的变化，只更新 config 字段 */
watchEffect(() => {
  try {
    config.value = props.device.config ? JSON.parse(props.device.config) : {};
    // 将对象转换为格式化的 JSON 字符串
    configString.value = JSON.stringify(config.value, null, 2);
  } catch {
    config.value = {};
    configString.value = '{}';
  }
});

const isEditing = ref(false); // 编辑状态

/** 格式化的配置用于只读展示 */
const formattedConfig = computed(() => {
  try {
    if (typeof config.value === 'string') {
      return JSON.stringify(JSON.parse(config.value), null, 2);
    }
    return JSON.stringify(config.value, null, 2);
  } catch {
    return JSON.stringify(config.value, null, 2);
  }
});

/** 启用编辑模式的函数 */
function handleEdit() {
  isEditing.value = true;
  // 重新同步编辑器内容
  configString.value = JSON.stringify(config.value, null, 2);
}

/** 取消编辑的函数 */
function handleCancelEdit() {
  try {
    config.value = props.device.config ? JSON.parse(props.device.config) : {};
    configString.value = JSON.stringify(config.value, null, 2);
  } catch {
    config.value = {};
    configString.value = '{}';
  }
  isEditing.value = false;
}

/** 保存配置的函数 */
async function saveConfig() {
  // 验证 JSON 格式
  try {
    config.value = JSON.parse(configString.value);
  } catch (error) {
    console.error('JSON格式错误:', error);
    message.error({ content: 'JSON格式错误，请修正后再提交！' });
    return;
  }
  saveLoading.value = true;
  try {
    await updateDeviceConfig();
    isEditing.value = false;
  } finally {
    saveLoading.value = false;
  }
}

/** 配置推送处理函数 */
async function handleConfigPush() {
  pushLoading.value = true;
  try {
    // 调用配置推送接口
    await sendDeviceMessage({
      deviceId: props.device.id!,
      method: IotDeviceMessageMethodEnum.CONFIG_PUSH.method,
      params: config.value,
    });
    // 提示成功
    message.success({ content: '配置推送成功！' });
  } finally {
    pushLoading.value = false;
  }
}

/** 更新设备配置 */
async function updateDeviceConfig() {
  try {
    // 提交请求
    loading.value = true;
    await updateDevice({
      id: props.device.id,
      config: JSON.stringify(config.value),
    } as IotDeviceApi.Device);
    message.success({ content: '更新成功！' });
    // 触发 success 事件
    emit('success');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <!-- 使用说明提示 -->
    <Alert
      class="my-4"
      description="如需编辑文件，请点击下方编辑按钮"
      message="支持远程更新设备的配置文件(JSON 格式)，可以在下方编辑配置模板，对设备的系统参数、网络参数等进行远程配置。配置完成后，需点击「配置推送」按钮，设备即可进行远程配置。"
      show-icon
      type="info"
    />

    <!-- 代码视图 - 只读展示 -->
    <div v-if="!isEditing" class="json-viewer-container">
      <pre class="json-code"><code>{{ formattedConfig }}</code></pre>
    </div>

    <!-- 编辑器视图 - 可编辑 -->
    <Textarea
      v-else
      v-model:value="configString"
      :rows="20"
      class="json-editor"
      placeholder="请输入 JSON 格式的配置信息"
    />

    <!-- 操作按钮 -->
    <div class="mt-5 text-center">
      <Button v-if="isEditing" @click="handleCancelEdit">取消</Button>
      <Button
        v-if="isEditing"
        :loading="saveLoading"
        type="primary"
        @click="saveConfig"
      >
        保存
      </Button>
      <Button v-else @click="handleEdit">编辑</Button>
      <Button
        v-if="!isEditing"
        :loading="pushLoading"
        type="primary"
        @click="handleConfigPush"
      >
        配置推送
      </Button>
    </div>
  </div>
</template>

<style scoped>
.json-viewer-container {
  max-height: 600px;
  padding: 12px;
  overflow-y: auto;
  background-color: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.json-code {
  margin: 0;
  font-family: Monaco, Menlo, 'Ubuntu Mono', Consolas, monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #333;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.json-editor {
  font-family: Monaco, Menlo, 'Ubuntu Mono', Consolas, monospace;
  font-size: 13px;
}
</style>
