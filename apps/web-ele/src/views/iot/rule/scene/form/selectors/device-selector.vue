<script setup lang="ts">
import { ref, watch } from 'vue';

import { DEVICE_SELECTOR_OPTIONS, DICT_TYPE } from '@vben/constants';

import { ElOption, ElSelect } from 'element-plus';

import { getDeviceListByProductId } from '#/api/iot/device/device';
import { DictTag } from '#/components/dict-tag';

/** 设备选择器组件 */
defineOptions({ name: 'DeviceSelector' });

const props = defineProps<{
  modelValue?: number;
  productId?: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value?: number): void;
  (e: 'change', value?: number): void;
}>();

const deviceLoading = ref(false); // 设备加载状态
const deviceList = ref<any[]>([]); // 设备列表

/**
 * 处理选择变化事件
 * @param value 选中的设备ID
 */
function handleChange(value?: number) {
  emit('update:modelValue', value);
  emit('change', value);
}

/**
 * 获取设备列表
 */
async function getDeviceList() {
  if (!props.productId) {
    deviceList.value = [];
    return;
  }

  try {
    deviceLoading.value = true;
    const data = await getDeviceListByProductId(props.productId);
    deviceList.value = data || [];
  } catch (error) {
    console.error('获取设备列表失败 ：', error);
    deviceList.value = [];
  } finally {
    deviceList.value.unshift(DEVICE_SELECTOR_OPTIONS.ALL_DEVICES);
    deviceLoading.value = false;
  }
}

// 监听产品变化
watch(
  () => props.productId,
  async (newProductId, oldProductId) => {
    if (!newProductId) {
      deviceList.value = [];
      if (props.modelValue !== undefined && props.modelValue !== null) {
        emit('update:modelValue', undefined);
        emit('change', undefined);
      }
      return;
    }
    await getDeviceList();
    // 切换到新 productId 时，旧 deviceId 不在新列表里则清空
    if (
      oldProductId !== undefined &&
      oldProductId !== newProductId &&
      props.modelValue !== undefined &&
      props.modelValue !== null &&
      !deviceList.value.some((d: any) => d.id === props.modelValue)
    ) {
      emit('update:modelValue', undefined);
      emit('change', undefined);
    }
  },
  { immediate: true },
);
</script>

<template>
  <ElSelect
    :model-value="modelValue"
    @update:model-value="handleChange"
    placeholder="请选择设备"
    filterable
    clearable
    class="w-full"
    :loading="deviceLoading"
    :disabled="!productId"
  >
    <ElOption
      v-for="device in deviceList"
      :key="device.id"
      :label="device.deviceName"
      :value="device.id"
    >
      <div class="py-[4px] flex w-full items-center justify-between">
        <div class="flex-1">
          <div
            class="text-[14px] font-500 mb-[2px] text-[var(--el-text-color-primary)]"
          >
            {{ device.deviceName }}
          </div>
          <div class="text-[12px] text-[var(--el-text-color-secondary)]">
            {{ device.deviceKey }}
          </div>
        </div>
        <div class="gap-[4px] flex items-center" v-if="device.id > 0">
          <DictTag :type="DICT_TYPE.IOT_DEVICE_STATE" :value="device.state" />
        </div>
      </div>
    </ElOption>
  </ElSelect>
</template>
