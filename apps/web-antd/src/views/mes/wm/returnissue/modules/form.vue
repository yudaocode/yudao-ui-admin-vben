<script lang="ts" setup>
import type { FormType } from '../data';

import type { MesWmReturnIssueApi } from '#/api/mes/wm/returnissue';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { MesWmReturnIssueStatusEnum } from '@vben/constants';

import { Button, Divider, message, Popconfirm } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createReturnIssue,
  finishReturnIssue,
  getReturnIssue,
  stockReturnIssue,
  submitReturnIssue,
  updateReturnIssue,
} from '#/api/mes/wm/returnissue';
import { $t } from '#/locales';

import { useFormSchema } from '../data';
import LineList from './line-list.vue';

const emit = defineEmits(['success']);
const formType = ref<FormType>('create');
const formData = ref<MesWmReturnIssueApi.ReturnIssue>();
const originalSnapshot = ref(''); // 表单原始数据快照，用于提交时跳过未变更的保存请求
const isEditable = computed(() => // 是否为编辑模式（可保存）
  ['create', 'update'].includes(formType.value),
);
const isStock = computed(() => formType.value === 'stock'); // 是否为入库上架模式
const isFinish = computed(() => formType.value === 'finish'); // 是否为执行退料模式
const canSubmit = computed(() => // 是否可提交
  formType.value === 'update' &&
  formData.value?.status === MesWmReturnIssueStatusEnum.PREPARE,
);
const getTitle = computed(() => {
  if (formType.value === 'detail') {
    return $t('ui.actionTitle.view', ['生产退料单']);
  }
  if (formType.value === 'stock') {
    return '入库上架';
  }
  if (formType.value === 'finish') {
    return '执行退料';
  }
  return formType.value === 'update'
    ? $t('ui.actionTitle.edit', ['生产退料单'])
    : $t('ui.actionTitle.create', ['生产退料单']);
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

/** 提交退料单：表单有修改时先保存，再调用提交接口 */
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
        (await formApi.getValues()) as MesWmReturnIssueApi.ReturnIssue;
      await updateReturnIssue({ ...formData.value, ...data });
      originalSnapshot.value = current;
    }
    await submitReturnIssue(formData.value.id);
    message.success('提交成功');
    await modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}

/** 入库上架 */
async function handleStock() {
  if (!formData.value?.id) {
    return;
  }
  modalApi.lock();
  try {
    await stockReturnIssue(formData.value.id);
    message.success('入库上架成功');
    await modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}

/** 执行退料 */
async function handleFinish() {
  if (!formData.value?.id) {
    return;
  }
  modalApi.lock();
  try {
    await finishReturnIssue(formData.value.id);
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
    const data = (await formApi.getValues()) as MesWmReturnIssueApi.ReturnIssue;
    try {
      if (formData.value?.id) {
        await updateReturnIssue({ ...formData.value, ...data });
        formData.value = { ...formData.value, ...data };
      } else {
        const id = await createReturnIssue(data);
        formData.value = {
          ...data,
          id,
          status: MesWmReturnIssueStatusEnum.PREPARE,
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
        formData.value = await getReturnIssue(data.id);
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
          title="确认提交该退料单？【提交后将不能修改】"
          @confirm="handleSubmit"
        >
          <Button type="primary">提交</Button>
        </Popconfirm>
        <Button v-if="isStock" type="primary" @click="handleStock">
          入库上架
        </Button>
        <Popconfirm
          v-if="isFinish"
          title="确认完成该退料单并执行入库吗？"
          @confirm="handleFinish"
        >
          <Button type="primary">执行退料</Button>
        </Popconfirm>
      </div>
    </template>
  </Modal>
</template>
