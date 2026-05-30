<script lang="ts" setup>
import type { FormType } from '../data';

import type { MesWmProductIssueApi } from '#/api/mes/wm/productissue';

import { computed, ref } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { MesWmProductIssueStatusEnum } from '@vben/constants';

import { Button, Divider, message, Popconfirm } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  checkProductIssueQuantity,
  createProductIssue,
  finishProductIssue,
  getProductIssue,
  stockProductIssue,
  submitProductIssue,
  updateProductIssue,
} from '#/api/mes/wm/productissue';
import { $t } from '#/locales';

import { useFormSchema } from '../data';
import LineList from './line-list.vue';

const emit = defineEmits(['success']);
const formType = ref<FormType>('create');
const formData = ref<MesWmProductIssueApi.ProductIssue>();
const originalSnapshot = ref(''); // 表单原始数据快照，用于提交时跳过未变更的保存请求
const isEditable = computed(() => // 是否为编辑模式（可保存）
  ['create', 'update'].includes(formType.value),
);
const isStock = computed(() => formType.value === 'stock'); // 是否为拣货模式
const isFinish = computed(() => formType.value === 'finish'); // 是否为完成出库模式
const canSubmit = computed(() => // 是否可提交
  formType.value === 'update' &&
  formData.value?.status === MesWmProductIssueStatusEnum.PREPARE,
);
const getTitle = computed(() => {
  if (formType.value === 'detail') {
    return $t('ui.actionTitle.view', ['领料出库单']);
  }
  if (formType.value === 'stock') {
    return '执行拣货';
  }
  if (formType.value === 'finish') {
    return '完成领料出库';
  }
  return formType.value === 'update'
    ? $t('ui.actionTitle.edit', ['领料出库单'])
    : $t('ui.actionTitle.create', ['领料出库单']);
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

/** 提交领料单：表单有修改时先保存，再调用提交接口 */
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
        (await formApi.getValues()) as MesWmProductIssueApi.ProductIssue;
      await updateProductIssue({ ...formData.value, ...data });
      originalSnapshot.value = current;
    }
    await submitProductIssue(formData.value.id);
    message.success('提交成功');
    await modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}

/** 执行拣货：领料数量与拣货数量不一致时二次确认 */
async function handleStock() {
  if (!formData.value?.id) {
    return;
  }
  const quantityMatch = await checkProductIssueQuantity(formData.value.id);
  if (!quantityMatch) {
    try {
      await confirm('领料数量与拣货数量不一致，确认执行拣货？');
    } catch {
      return;
    }
  }
  modalApi.lock();
  try {
    await stockProductIssue(formData.value.id);
    message.success('拣货成功');
    await modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}

/** 完成领料出库 */
async function handleFinish() {
  if (!formData.value?.id) {
    return;
  }
  modalApi.lock();
  try {
    await finishProductIssue(formData.value.id);
    message.success('完成成功');
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
      (await formApi.getValues()) as MesWmProductIssueApi.ProductIssue;
    try {
      if (formData.value?.id) {
        await updateProductIssue({ ...formData.value, ...data });
        formData.value = { ...formData.value, ...data };
      } else {
        const id = await createProductIssue(data);
        formData.value = {
          ...data,
          id,
          status: MesWmProductIssueStatusEnum.PREPARE,
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
        formData.value = await getProductIssue(data.id);
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
        <LineList :form-type="formType" :issue-id="formData.id" />
      </div>
    </template>
    <template #prepend-footer>
      <div class="flex flex-auto items-center gap-2">
        <Popconfirm
          v-if="canSubmit"
          title="确认提交该领料出库单？【提交后将不能修改】"
          @confirm="handleSubmit"
        >
          <Button type="primary">提交</Button>
        </Popconfirm>
        <Button v-if="isStock" type="primary" @click="handleStock">
          执行拣货
        </Button>
        <Popconfirm
          v-if="isFinish"
          title="确认完成该领料单并执行出库吗？"
          @confirm="handleFinish"
        >
          <Button type="primary">完成</Button>
        </Popconfirm>
      </div>
    </template>
  </Modal>
</template>
