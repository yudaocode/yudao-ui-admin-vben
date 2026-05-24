<!-- 设备配置 -->
<script lang="ts" setup>
import type { IotDeviceApi } from '#/api/iot/device/device';

import { computed, ref, watchEffect } from 'vue';

import { IotDeviceMessageMethodEnum } from '@vben/constants';

import {
  ElAlert,
  ElButton,
  ElInput,
  ElMessage,
  ElPopconfirm,
} from 'element-plus';

import { sendDeviceMessage, updateDevice } from '#/api/iot/device/device';

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
    ElMessage.error('JSON格式错误，请修正后再提交！');
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
    ElMessage.success('配置推送成功！');
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
    ElMessage.success('更新成功！');
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
    <ElAlert
      class="!mb-4"
      description="如需编辑文件，请点击下方编辑按钮"
      title="支持远程更新设备的配置文件(JSON 格式)，可以在下方编辑配置模板，对设备的系统参数、网络参数等进行远程配置。配置完成后，需点击「配置推送」按钮，设备即可进行远程配置。"
      show-icon
      :closable="false"
      type="info"
    />

    <!-- 代码视图 - 只读展示 -->
    <pre
      v-if="!isEditing"
      class="m-0 h-[460px] overflow-y-auto whitespace-pre-wrap break-words rounded border border-[#d9d9d9] bg-[#f5f5f5] p-3 font-mono text-[13px] leading-normal text-[#333] dark:border-[#3a3a3a] dark:bg-[#1a1a1a] dark:text-gray-300"
      v-text="formattedConfig"
    ></pre>

    <!-- 编辑器视图 - 可编辑 -->
    <ElInput
      v-else
      v-model="configString"
      type="textarea"
      :autosize="{ minRows: 20, maxRows: 20 }"
      class="!h-[460px] font-mono text-[13px]"
      placeholder="请输入 JSON 格式的配置信息"
    />

    <!-- 操作按钮 -->
    <div class="mt-4 flex justify-center gap-2">
      <ElButton v-if="isEditing" @click="handleCancelEdit">取消</ElButton>
      <ElButton
        v-if="isEditing"
        :loading="saveLoading"
        type="primary"
        @click="saveConfig"
      >
        保存
      </ElButton>
      <ElButton v-else @click="handleEdit">编辑</ElButton>
      <ElPopconfirm
        v-if="!isEditing"
        title="确定要推送配置到设备吗？此操作将远程更新设备配置。"
        @confirm="handleConfigPush"
      >
        <template #reference>
          <ElButton :loading="pushLoading" type="primary"> 配置推送 </ElButton>
        </template>
      </ElPopconfirm>
    </div>
  </div>
</template>
