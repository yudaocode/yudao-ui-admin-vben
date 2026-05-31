<script lang="ts" setup>
import type { FormType } from '../data';

import type { MesMdWorkshopApi } from '#/api/mes/md/workstation/workshop';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { BarcodeBizTypeEnum } from '@vben/constants';

import { ElButton, ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createWorkshop,
  getWorkshop,
  updateWorkshop,
} from '#/api/mes/md/workstation/workshop';
import { $t } from '#/locales';
import { BarcodeDetail } from '#/views/mes/wm/barcode/components';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formType = ref<FormType>('create'); // 表单模式
const formData = ref<MesMdWorkshopApi.Workshop>();
const barcodeDetailRef = ref<InstanceType<typeof BarcodeDetail>>(); // 条码详情弹窗

const isDetail = computed(() => formType.value === 'detail'); // 是否查看模式
const getTitle = computed(() => {
  if (formType.value === 'detail') {
    return '查看车间';
  }
  return formType.value === 'update' ? '修改车间' : '新增车间';
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
    // 加载数据
    const data = modalApi.getData<{ formType: FormType; id?: number }>();
    formType.value = data.formType;
    formApi.setState({ schema: useFormSchema(data.formType, formApi) });
    formApi.setDisabled(formType.value === 'detail');
    modalApi.setState({ showConfirmButton: formType.value !== 'detail' });
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
