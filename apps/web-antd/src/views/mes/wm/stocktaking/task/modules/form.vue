<script lang="ts" setup>
import type { FormType } from '../data';

import type { MesWmStockTakingTaskApi } from '#/api/mes/wm/stocktaking/task';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { MesWmStockTakingTaskStatusEnum } from '@vben/constants';
import { useUserStore } from '@vben/stores';

import { Button, message, Popconfirm, Tabs } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createStockTaking,
  finishStockTaking,
  getStockTaking,
  submitStockTaking,
  updateStockTaking,
} from '#/api/mes/wm/stocktaking/task';
import { $t } from '#/locales';

import { useFormSchema } from '../data';
import LineList from './line-list.vue';
import ResultList from './result-list.vue';

const emit = defineEmits(['success']);
const userStore = useUserStore();
const formType = ref<FormType>('create');
const formData = ref<MesWmStockTakingTaskApi.StockTakingTask>();
const subTabsName = ref('lines'); // 子表当前 tab
const originalSnapshot = ref(''); // 表单原始数据快照，用于提交时跳过未变更的保存请求

const isEditable = computed(() =>
  ['create', 'update'].includes(formType.value),
);
const isExecute = computed(() => formType.value === 'execute'); // 是否执行盘点模式
const isSubmit = computed(() => formType.value === 'submit'); // 是否提交模式
const canSubmit = computed(
  () =>
    formType.value === 'update' &&
    formData.value?.status === MesWmStockTakingTaskStatusEnum.PREPARE,
);
const showLineTab = computed(() => !formData.value?.blindFlag); // 盲盘不展示盘点清单
const showResultTab = computed(
  () =>
    isExecute.value ||
    (!!formData.value?.status &&
      formData.value.status !== MesWmStockTakingTaskStatusEnum.PREPARE),
);
const getTitle = computed(() => {
  if (formType.value === 'detail') {
    return $t('ui.actionTitle.view', ['盘点任务']);
  }
  if (formType.value === 'execute') {
    return '执行盘点';
  }
  if (formType.value === 'submit') {
    return '提交盘点任务';
  }
  return formType.value === 'update'
    ? $t('ui.actionTitle.edit', ['盘点任务'])
    : $t('ui.actionTitle.create', ['盘点任务']);
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

/** 提交盘点任务：表单有修改时先保存，再调用提交接口 */
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
        (await formApi.getValues()) as MesWmStockTakingTaskApi.StockTakingTask;
      await updateStockTaking({ ...formData.value, ...data });
      originalSnapshot.value = current;
    }
    await submitStockTaking(formData.value.id);
    message.success('提交成功');
    await modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}

/** 执行盘点 */
async function handleExecute() {
  if (!formData.value?.id) {
    return;
  }
  modalApi.lock();
  try {
    await finishStockTaking(formData.value.id);
    message.success('执行盘点成功');
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
      (await formApi.getValues()) as MesWmStockTakingTaskApi.StockTakingTask;
    try {
      if (formData.value?.id) {
        await updateStockTaking({ ...formData.value, ...data });
        formData.value = { ...formData.value, ...data };
      } else {
        const id = await createStockTaking(data);
        formData.value = {
          ...data,
          id,
          status: MesWmStockTakingTaskStatusEnum.PREPARE,
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
    subTabsName.value = data.formType === 'execute' ? 'results' : 'lines';
    formApi.setState({ schema: useFormSchema(formType.value, formApi) });
    formApi.setDisabled(!isEditable.value);
    modalApi.setState({ showConfirmButton: isEditable.value });
    if (data?.id) {
      modalApi.lock();
      try {
        formData.value = await getStockTaking(data.id);
        // 设置到 values
        await formApi.setValues(formData.value);
      } finally {
        modalApi.unlock();
      }
    } else {
      // 新建时默认盘点人为当前登录用户
      await formApi.setFieldValue('userId', userStore.userInfo?.id);
    }
    originalSnapshot.value = JSON.stringify(await formApi.getValues());
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-4/5">
    <Form class="mx-4" />
    <Tabs
      v-if="formData?.id"
      v-model:active-key="subTabsName"
      class="mx-4 mt-4"
      type="card"
    >
      <Tabs.TabPane v-if="showLineTab" key="lines" tab="盘点清单">
        <LineList :form-type="formType" :task-id="formData.id" />
      </Tabs.TabPane>
      <Tabs.TabPane v-if="showResultTab" key="results" tab="盘点结果">
        <ResultList
          :form-type="isExecute ? 'execute' : 'detail'"
          :task-id="formData.id"
        />
      </Tabs.TabPane>
    </Tabs>
    <template #prepend-footer>
      <div class="flex flex-auto items-center gap-2">
        <Popconfirm
          v-if="canSubmit || isSubmit"
          title="确认提交该盘点任务？【提交后将不能修改】"
          @confirm="handleSubmit"
        >
          <Button type="primary">提交</Button>
        </Popconfirm>
        <Popconfirm
          v-if="isExecute"
          title="确认执行盘点操作？"
          @confirm="handleExecute"
        >
          <Button type="primary">执行盘点</Button>
        </Popconfirm>
      </div>
    </template>
  </Modal>
</template>
