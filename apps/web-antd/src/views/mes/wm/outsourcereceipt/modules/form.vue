<script lang="ts" setup>
import type { FormType } from '../data';

import type { MesWmOutsourceReceiptApi } from '#/api/mes/wm/outsourcereceipt';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { MesWmOutsourceReceiptStatusEnum } from '@vben/constants';

import { Button, Divider, message, Popconfirm } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createOutsourceReceipt,
  finishOutsourceReceipt,
  getOutsourceReceipt,
  stockOutsourceReceipt,
  submitOutsourceReceipt,
  updateOutsourceReceipt,
} from '#/api/mes/wm/outsourcereceipt';
import { $t } from '#/locales';

import { useFormSchema } from '../data';
import LineList from './line-list.vue';

const emit = defineEmits(['success']);
const formType = ref<FormType>('create');
const formData = ref<MesWmOutsourceReceiptApi.OutsourceReceipt>();
const originalSnapshot = ref(''); // 表单原始数据快照，用于提交时跳过未变更的保存请求
const isEditable = computed(() => // 是否为编辑模式（可保存）
  ['create', 'update'].includes(formType.value),
);
const isStock = computed(() => formType.value === 'stock'); // 是否为上架模式
const isFinish = computed(() => formType.value === 'finish'); // 是否为完成入库模式
const canSubmit = computed(() => // 是否可提交
  formType.value === 'update' &&
  formData.value?.status === MesWmOutsourceReceiptStatusEnum.PREPARE,
);
const getTitle = computed(() => {
  if (formType.value === 'detail') {
    return $t('ui.actionTitle.view', ['外协入库单']);
  }
  if (formType.value === 'stock') {
    return '执行上架';
  }
  if (formType.value === 'finish') {
    return '完成入库';
  }
  return formType.value === 'update'
    ? $t('ui.actionTitle.edit', ['外协入库单'])
    : $t('ui.actionTitle.create', ['外协入库单']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-1',
    labelWidth: 110,
  },
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-3',
});

/** 提交入库单：表单有修改时先保存，再调用提交接口 */
async function handleSubmit() {
  const { valid } = await formApi.validate();
  if (!valid || !formData.value?.id) {
    return;
  }
  modalApi.lock();
  try {
    const current = JSON.stringify(await formApi.getValues());
    if (current !== originalSnapshot.value) {
      const data =
        (await formApi.getValues()) as MesWmOutsourceReceiptApi.OutsourceReceipt;
      await updateOutsourceReceipt({ ...formData.value, ...data });
      originalSnapshot.value = current;
    }
    await submitOutsourceReceipt(formData.value.id);
    message.success('提交成功');
    await modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}

/** 执行上架 */
async function handleStock() {
  if (!formData.value?.id) {
    return;
  }
  modalApi.lock();
  try {
    await stockOutsourceReceipt(formData.value.id);
    message.success('上架成功');
    await modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}

/** 完成入库 */
async function handleFinish() {
  if (!formData.value?.id) {
    return;
  }
  modalApi.lock();
  try {
    await finishOutsourceReceipt(formData.value.id);
    message.success('入库成功');
    await modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (!isEditable.value) {
      await modalApi.close();
      return;
    }
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data =
      (await formApi.getValues()) as MesWmOutsourceReceiptApi.OutsourceReceipt;
    try {
      if (formData.value?.id) {
        await updateOutsourceReceipt({ ...formData.value, ...data });
        formData.value = { ...formData.value, ...data };
      } else {
        const id = await createOutsourceReceipt(data);
        formData.value = {
          ...data,
          id,
          status: MesWmOutsourceReceiptStatusEnum.PREPARE,
        };
        await formApi.setFieldValue('id', id);
        await formApi.setFieldValue('status', formData.value.status);
        formType.value = 'update';
      }
      originalSnapshot.value = JSON.stringify(await formApi.getValues());
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      originalSnapshot.value = '';
      return;
    }
    // 加载数据
    const data = modalApi.getData<{ formType: FormType; id?: number }>();
    formType.value = data.formType;
    formApi.setState({ schema: useFormSchema(formType.value, formApi) });
    formApi.setDisabled(!isEditable.value);
    modalApi.setState({ showConfirmButton: isEditable.value });
    if (data?.id) {
      modalApi.lock();
      try {
        formData.value = await getOutsourceReceipt(data.id);
        // 设置到 values
        await formApi.setValues(formData.value);
      } finally {
        modalApi.unlock();
      }
    }
    originalSnapshot.value = JSON.stringify(await formApi.getValues());
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-3/5">
    <Form class="mx-4" />
    <!-- 非新建模式展示物料信息 -->
    <template v-if="formData?.id">
      <Divider>物料信息</Divider>
      <div class="mx-4">
        <LineList :form-type="formType" :receipt-id="formData.id" />
      </div>
    </template>
    <template #prepend-footer>
      <div class="flex flex-auto items-center gap-2">
        <Popconfirm
          v-if="canSubmit"
          title="确认提交该外协入库单？【提交后将不能修改】"
          @confirm="handleSubmit"
        >
          <Button type="primary">提交</Button>
        </Popconfirm>
        <Popconfirm
          v-if="isStock"
          title="确认执行上架？"
          @confirm="handleStock"
        >
          <Button type="primary">执行上架</Button>
        </Popconfirm>
        <Popconfirm
          v-if="isFinish"
          title="确认完成入库？完成后将更新库存台账。"
          @confirm="handleFinish"
        >
          <Button type="primary">完成入库</Button>
        </Popconfirm>
      </div>
    </template>
  </Modal>
</template>
