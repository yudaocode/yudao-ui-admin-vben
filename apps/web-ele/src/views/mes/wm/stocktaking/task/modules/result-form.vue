<script lang="ts" setup>
import type { MesWmStockTakingResultApi } from '#/api/mes/wm/stocktaking/task/result';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { getStockTakingTaskLineSimpleList } from '#/api/mes/wm/stocktaking/task/line';
import {
  createStockTakingResult,
  getStockTakingResult,
  updateStockTakingResult,
} from '#/api/mes/wm/stocktaking/task/result';
import { $t } from '#/locales';

import { useResultFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<MesWmStockTakingResultApi.StockTakingResult>();
const taskId = ref<number>();
const isExecute = ref(false); // 是否执行盘点模式（可选择盘点清单回填）

const getTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', ['盘点结果'])
    : $t('ui.actionTitle.create', ['盘点结果']),
);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-1',
    labelWidth: 100,
  },
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-3',
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data =
      (await formApi.getValues()) as MesWmStockTakingResultApi.StockTakingResult;
    data.taskId = taskId.value;
    try {
      await (formData.value?.id
        ? updateStockTakingResult({ ...data, id: formData.value.id })
        : createStockTakingResult(data));
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
    const data = modalApi.getData<{
      execute?: boolean;
      id?: number;
      taskId: number;
    }>();
    taskId.value = data.taskId;
    isExecute.value = !!data.execute;
    // 执行盘点模式：加载盘点清单作为可选项，供选择后回填
    const taskLines =
      isExecute.value && !data.id
        ? await getStockTakingTaskLineSimpleList(data.taskId)
        : [];
    formApi.setState({ schema: useResultFormSchema(formApi, taskLines) });
    if (!data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getStockTakingResult(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-3/5">
    <Form />
  </Modal>
</template>
