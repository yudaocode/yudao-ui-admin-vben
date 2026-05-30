<script lang="ts" setup>
import type { FormType } from '../data';

import type { MesWmArrivalNoticeApi } from '#/api/mes/wm/arrivalnotice';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { MesWmArrivalNoticeStatusEnum } from '@vben/constants';

import { ElButton, ElDivider, ElMessage, ElPopconfirm } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createArrivalNotice,
  getArrivalNotice,
  submitArrivalNotice,
  updateArrivalNotice,
} from '#/api/mes/wm/arrivalnotice';
import { $t } from '#/locales';

import { useFormSchema } from '../data';
import LineList from './line-list.vue';

const emit = defineEmits(['success']);
const formType = ref<FormType>('create');
const formData = ref<MesWmArrivalNoticeApi.ArrivalNotice>();
const originalSnapshot = ref(''); // 表单原始数据快照，用于提交时跳过未变更的保存请求
const isEditable = computed(() => // 是否为编辑模式（可保存）
  ['create', 'update'].includes(formType.value),
);
const canSubmit = computed(() => // 是否可提交
  formType.value === 'update' &&
  formData.value?.status === MesWmArrivalNoticeStatusEnum.PREPARE,
);
const getTitle = computed(() => {
  if (formType.value === 'detail') {
    return $t('ui.actionTitle.view', ['到货通知单']);
  }
  return formType.value === 'update'
    ? $t('ui.actionTitle.edit', ['到货通知单'])
    : $t('ui.actionTitle.create', ['到货通知单']);
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

/** 提交通知单：表单有修改时先保存，再调用提交接口 */
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
        (await formApi.getValues()) as MesWmArrivalNoticeApi.ArrivalNotice;
      await updateArrivalNotice({ ...formData.value, ...data });
      originalSnapshot.value = current;
    }
    await submitArrivalNotice(formData.value.id);
    ElMessage.success('提交成功');
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
      (await formApi.getValues()) as MesWmArrivalNoticeApi.ArrivalNotice;
    try {
      if (formData.value?.id) {
        await updateArrivalNotice({ ...formData.value, ...data });
        formData.value = { ...formData.value, ...data };
      } else {
        const id = await createArrivalNotice(data);
        formData.value = {
          ...data,
          id,
          status: MesWmArrivalNoticeStatusEnum.PREPARE,
        };
        await formApi.setFieldValue('id', id);
        await formApi.setFieldValue('status', formData.value.status);
        formType.value = 'update';
      }
      originalSnapshot.value = JSON.stringify(await formApi.getValues());
      emit('success');
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
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
        formData.value = await getArrivalNotice(data.id);
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
      <ElDivider>物料信息</ElDivider>
      <div class="mx-4">
        <LineList :form-type="formType" :notice-id="formData.id" />
      </div>
    </template>
    <template #prepend-footer>
      <div class="flex flex-auto items-center gap-2">
        <ElPopconfirm
          v-if="canSubmit"
          title="确认提交该到货通知单？【提交后将不能修改】"
          width="260"
          @confirm="handleSubmit"
        >
          <template #reference>
            <ElButton type="primary">提交</ElButton>
          </template>
        </ElPopconfirm>
      </div>
    </template>
  </Modal>
</template>
