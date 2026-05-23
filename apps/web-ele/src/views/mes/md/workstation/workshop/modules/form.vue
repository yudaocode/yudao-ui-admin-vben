<script lang="ts" setup>
import type { MesMdWorkshopApi } from '#/api/mes/md/workstation/workshop';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElButton, ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createWorkshop,
  getWorkshop,
  updateWorkshop,
} from '#/api/mes/md/workstation/workshop';
import { $t } from '#/locales';
import { BarcodeBizTypeEnum } from '#/views/mes/utils/constants';
import { BarcodeDetail } from '#/views/mes/wm/barcode/components';

import { useFormSchema } from '../data';

type FormMode = 'create' | 'detail' | 'update';

const emit = defineEmits(['success']);
const formMode = ref<FormMode>('create'); // 表单模式
const formData = ref<MesMdWorkshopApi.Workshop>();
const barcodeDetailRef = ref<InstanceType<typeof BarcodeDetail>>(); // 条码详情弹窗

const isDetail = computed(() => formMode.value === 'detail'); // 是否查看模式
const getTitle = computed(() => {
  const titles: Record<FormMode, string> = {
    create: '新增车间',
    update: '修改车间',
    detail: '查看车间',
  };
  return titles[formMode.value];
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-1',
    labelWidth: 100,
  },
  wrapperClass: 'grid-cols-2',
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
});

/** 表单 schema 需要 formApi 引用，所以通过 setState 设置 schema */
formApi.setState({ schema: useFormSchema(formApi) });

/** 查看车间条码 */
function handleBarcode() {
  if (!formData.value?.id) {
    return;
  }
  barcodeDetailRef.value?.openByBusiness(
    formData.value.id,
    BarcodeBizTypeEnum.WORKSHOP,
    formData.value.code,
    formData.value.name,
  );
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (isDetail.value) {
      await modalApi.close();
      return;
    }
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as MesMdWorkshopApi.Workshop;
    try {
      await (formData.value?.id ? updateWorkshop(data) : createWorkshop(data));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    await formApi.resetForm();
    // 加载数据
    const data = modalApi.getData<{ id?: number; type?: FormMode }>();
    formMode.value = data?.type || 'create';
    formApi.setDisabled(formMode.value === 'detail');
    modalApi.setState({ showConfirmButton: formMode.value !== 'detail' });
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getWorkshop(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-1/2">
    <Form class="mx-4" />
    <template v-if="isDetail && formData?.id" #prepend-footer>
      <div class="flex flex-auto items-center">
        <ElButton @click="handleBarcode">查看条码</ElButton>
      </div>
    </template>
  </Modal>
  <BarcodeDetail ref="barcodeDetailRef" />
</template>
