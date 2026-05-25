<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { MesProRouteProcessApi } from '#/api/mes/pro/route/process';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { getProcessSimpleList } from '#/api/mes/pro/process';
import {
  createRouteProcess,
  updateRouteProcess,
} from '#/api/mes/pro/route/process';
import { $t } from '#/locales';

import { useRouteProcessFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<MesProRouteProcessApi.RouteProcess>();
const getTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', ['工艺路线工序'])
    : $t('ui.actionTitle.create', ['工艺路线工序']),
);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: { class: 'w-full' },
    formItemClass: 'col-span-1',
    labelWidth: 130,
  },
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2',
});

async function loadSchema(): Promise<VbenFormSchema[]> {
  const list = await getProcessSimpleList();
  const options = (list || []).map((item) => ({
    label: item.name ?? '',
    value: item.id!,
  }));
  return useRouteProcessFormSchema(options);
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    const data =
      (await formApi.getValues()) as MesProRouteProcessApi.RouteProcess;
    try {
      await (formData.value?.id
        ? updateRouteProcess(data)
        : createRouteProcess(data));
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
    modalApi.lock();
    try {
      const schema = await loadSchema();
      formApi.setState({ schema });
      await formApi.resetForm();
    } finally {
      modalApi.unlock();
    }
    const data = modalApi.getData<{
      id?: number;
      maxSort?: number;
      routeId: number;
      row?: MesProRouteProcessApi.RouteProcess;
    }>();
    if (!data) {
      return;
    }
    if (!data.id) {
      await formApi.setValues({
        colorCode: '#00AEF3',
        routeId: data.routeId,
        sort: (data.maxSort || 0) + 1,
      });
      return;
    }
    if (data.row) {
      formData.value = data.row;
      await formApi.setValues(data.row);
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-3/5">
    <Form class="mx-4" />
  </Modal>
</template>
