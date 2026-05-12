<script setup lang="ts">
import type { IotDeviceApi } from '#/api/iot/device/device';
import type { IotProductApi } from '#/api/iot/product/product';

import { computed, nextTick, onMounted, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, Collapse, message, Space } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createDevice, getDevice, updateDevice } from '#/api/iot/device/device';
import { getSimpleProductList } from '#/api/iot/product/product';
import { MapDialog } from '#/components/map';
import { $t } from '#/locales';

import { useAdvancedFormSchema, useBasicFormSchema } from '../data';

defineOptions({ name: 'IoTDeviceForm' });

const emit = defineEmits(['success']);
const formData = ref<IotDeviceApi.Device>();
const products = ref<IotProductApi.Product[]>([]);
const activeKey = ref<string[]>([]);
const mapDialogRef = ref<InstanceType<typeof MapDialog>>();

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['设备'])
    : $t('ui.actionTitle.create', ['设备']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  wrapperClass: 'grid-cols-1',
  layout: 'horizontal',
  schema: useBasicFormSchema(),
  showDefaultActions: false,
  handleValuesChange: async (values, changedFields) => {
    // 当产品 ProductId 变化时，自动设置设备类型
    if (changedFields.includes('productId')) {
      const productId = values.productId;
      if (!productId) {
        await formApi.setFieldValue('deviceType', undefined);
        return;
      }
      // 从产品列表中查找产品
      const product = products.value.find((p) => p.id === productId);
      if (product?.deviceType !== undefined) {
        await formApi.setFieldValue('deviceType', product.deviceType);
      }
    }
  },
});

const [AdvancedForm, advancedFormApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  wrapperClass: 'grid-cols-1',
  layout: 'horizontal',
  schema: useAdvancedFormSchema(),
  showDefaultActions: false,
});

/** 获取高级表单的值（如果表单未挂载，则从 formData 中获取） */
async function getAdvancedFormValues() {
  if (advancedFormApi.isMounted) {
    return await advancedFormApi.getValues();
  }
  // 表单未挂载（折叠状态），从 formData 中获取
  return {
    nickname: formData.value?.nickname,
    picUrl: formData.value?.picUrl,
    groupIds: formData.value?.groupIds,
    serialNumber: formData.value?.serialNumber,
    longitude: formData.value?.longitude,
    latitude: formData.value?.latitude,
  };
}

/** 打开地图选择弹窗 */
async function openMapDialog() {
  // 如果高级表单未挂载，先展开 Collapse
  if (!advancedFormApi.isMounted) {
    activeKey.value = ['advanced'];
    await nextTick();
    await nextTick();
  }
  const values = await advancedFormApi.getValues();
  mapDialogRef.value?.open(
    values.longitude ? Number(values.longitude) : undefined,
    values.latitude ? Number(values.latitude) : undefined,
  );
}

/** 处理地图选择确认 */
async function handleMapConfirm(data: {
  address: string;
  latitude: string;
  longitude: string;
}) {
  if (advancedFormApi.isMounted) {
    await advancedFormApi.setFieldValue('longitude', Number(data.longitude));
    await advancedFormApi.setFieldValue('latitude', Number(data.latitude));
  }
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 合并两个表单的值（字段不冲突，可直接合并）
    const basicValues = await formApi.getValues();
    const advancedValues = await getAdvancedFormValues();
    const data = {
      ...basicValues,
      ...advancedValues,
    } as IotDeviceApi.Device;
    try {
      await (formData.value?.id ? updateDevice(data) : createDevice(data));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      activeKey.value = [];
      return;
    }
    // 加载数据
    const data = modalApi.getData<IotDeviceApi.Device>();
    if (!data || !data.id) {
      return;
    }
    // 编辑模式：加载数据
    modalApi.lock();
    try {
      formData.value = await getDevice(data.id);
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});

/** 监听 Collapse 展开，自动设置高级表单的值 */
watch(
  activeKey,
  async (newKeys) => {
    // 当用户手动展开 Collapse 且存在表单数据时，设置高级表单的值
    if (newKeys.includes('advanced') && formData.value) {
      // 等待表单挂载
      await nextTick();
      await nextTick();
      if (advancedFormApi.isMounted) {
        await advancedFormApi.setValues(formData.value);
      }
    }
  },
  { immediate: false },
);

/** 初始化产品列表 */
onMounted(async () => {
  products.value = await getSimpleProductList();
});
</script>

<template>
  <Modal :title="getTitle" class="w-2/5">
    <div class="mx-4">
      <Form />
      <Collapse v-model:active-key="activeKey" class="mt-4">
        <Collapse.Panel key="advanced" header="更多设置">
          <AdvancedForm />
          <Space class="mt-2">
            <Button type="primary" @click="openMapDialog">坐标拾取</Button>
          </Space>
        </Collapse.Panel>
      </Collapse>
    </div>
  </Modal>
  <!-- 地图选择弹窗 -->
  <MapDialog ref="mapDialogRef" @confirm="handleMapConfirm" />
</template>
