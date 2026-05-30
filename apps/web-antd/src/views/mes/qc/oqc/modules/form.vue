<script lang="ts" setup>
import type { FormType } from '../data';

import type { MesQcOqcApi } from '#/api/mes/qc/oqc';

import { computed, ref } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { MesQcStatusEnum, MesQcTypeEnum } from '@vben/constants';

import { Button, Descriptions, message, Tabs } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createOqc,
  finishOqc,
  getOqc,
  updateOqc,
} from '#/api/mes/qc/oqc';
import { $t } from '#/locales';

import { QcIndicatorResultList } from '../../indicatorresult/components';
import { useFormSchema } from '../data';
import LineList from './line-list.vue';

const emit = defineEmits(['success']);
const formType = ref<FormType>('create');
const formData = ref<MesQcOqcApi.Oqc>();
const subTabsName = ref('line');
const originalSnapshot = ref(''); // 表单原始数据快照，用于 finish 时跳过未变更的保存请求
const isDetail = computed(() => formType.value === 'detail');
const canFinish = computed(
  () =>
    formType.value === 'update' &&
    formData.value?.status === MesQcStatusEnum.DRAFT,
);
const getTitle = computed(() => {
  if (formType.value === 'detail') {
    return $t('ui.actionTitle.view', ['出货检验单']);
  }
  return formType.value === 'update'
    ? $t('ui.actionTitle.edit', ['出货检验单'])
    : $t('ui.actionTitle.create', ['出货检验单']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-1',
    labelWidth: 110,
  },
  wrapperClass: 'grid-cols-3',
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
});

/** 子表变更后刷新主表头数据（缺陷统计等） */
async function handleRefresh() {
  if (!formData.value?.id) {
    return;
  }
  formData.value = await getOqc(formData.value.id);
}

/** 提交表单 */
async function handleSubmit(): Promise<boolean> {
  const { valid } = await formApi.validate();
  if (!valid) {
    return false;
  }
  const data = (await formApi.getValues()) as MesQcOqcApi.Oqc;
  if (formData.value?.id) {
    await updateOqc({ ...data, id: formData.value.id });
    formData.value = { ...formData.value, ...data };
  } else {
    const id = await createOqc(data);
    formData.value = {
      ...data,
      id: id as unknown as number,
      status: MesQcStatusEnum.DRAFT,
    };
    await formApi.setFieldValue('id', formData.value.id);
    await formApi.setFieldValue('status', formData.value.status);
    formType.value = 'update';
  }
  originalSnapshot.value = JSON.stringify(await formApi.getValues());
  return true;
}

/** 完成检验单：表单有修改时先保存，再调用完成接口 */
async function handleFinish() {
  const id = formData.value?.id;
  if (!id) {
    return;
  }
  const { valid } = await formApi.validate();
  if (!valid) {
    return;
  }
  try {
    await confirm('是否完成出货检验单编制？【完成后将不能更改】');
  } catch {
    return;
  }
  modalApi.lock();
  try {
    const current = JSON.stringify(await formApi.getValues());
    if (current !== originalSnapshot.value) {
      const data = (await formApi.getValues()) as MesQcOqcApi.Oqc;
      await updateOqc({ ...data, id });
      formData.value = { ...formData.value, ...data };
      originalSnapshot.value = current;
    }
    await finishOqc(id);
    message.success('完成成功');
    await modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (isDetail.value) {
      await modalApi.close();
      return;
    }
    modalApi.lock();
    try {
      // 提交表单
      const ok = await handleSubmit();
      if (!ok) {
        return;
      }
      // 关闭并提示
      message.success($t('ui.actionMessage.operationSuccess'));
      await modalApi.close();
      emit('success');
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
    subTabsName.value = 'line';
    // 加载数据
    const data = modalApi.getData<{
      formType: FormType;
      id?: number;
      prefill?: MesQcOqcApi.Oqc;
    }>();
    formType.value = data.formType;
    formApi.setState({ schema: useFormSchema(formType.value, formApi) });
    formApi.setDisabled(formType.value === 'detail');
    modalApi.setState({ showConfirmButton: formType.value !== 'detail' });
    if (data?.id) {
      modalApi.lock();
      try {
        formData.value = await getOqc(data.id);
        // 设置到 values
        await formApi.setValues(formData.value);
      } finally {
        modalApi.unlock();
      }
    } else if (data?.prefill) {
      // 预填模式：来自待检任务。源项目靠 watcher 自动把 outQuantity 同步到
      // checkQuantity，这里显式补齐，避免必填的检测数量为空
      const prefill = {
        ...data.prefill,
        checkQuantity: data.prefill.checkQuantity ?? data.prefill.outQuantity,
      };
      formData.value = { ...prefill };
      // 设置到 values
      await formApi.setValues(prefill);
    }
    originalSnapshot.value = JSON.stringify(await formApi.getValues());
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-4/5">
    <Form class="mx-4" />
    <!-- 缺陷统计（只读） -->
    <div v-if="formData?.id" class="mx-4 mt-4">
      <Descriptions title="缺陷情况" :column="3" bordered size="small">
        <Descriptions.Item label="致命缺陷数">
          {{ formData.criticalQuantity ?? 0 }}
        </Descriptions.Item>
        <Descriptions.Item label="严重缺陷数">
          {{ formData.majorQuantity ?? 0 }}
        </Descriptions.Item>
        <Descriptions.Item label="轻微缺陷数">
          {{ formData.minorQuantity ?? 0 }}
        </Descriptions.Item>
        <Descriptions.Item label="致命缺陷率">
          {{ formData.criticalRate ?? 0 }}%
        </Descriptions.Item>
        <Descriptions.Item label="严重缺陷率">
          {{ formData.majorRate ?? 0 }}%
        </Descriptions.Item>
        <Descriptions.Item label="轻微缺陷率">
          {{ formData.minorRate ?? 0 }}%
        </Descriptions.Item>
      </Descriptions>
    </div>
    <Tabs
      v-if="formData?.id"
      v-model:active-key="subTabsName"
      class="mx-4 mt-4"
    >
      <Tabs.TabPane key="line" tab="检验项">
        <LineList
          :form-type="formType"
          :oqc-id="formData.id"
          @refresh="handleRefresh"
        />
      </Tabs.TabPane>
      <Tabs.TabPane key="result" tab="检测结果">
        <QcIndicatorResultList
          :qc-id="formData.id"
          :qc-type="MesQcTypeEnum.OQC"
          :readonly="isDetail"
        />
      </Tabs.TabPane>
    </Tabs>
    <template #prepend-footer>
      <div class="flex flex-auto items-center gap-2">
        <Button v-if="canFinish" type="primary" @click="handleFinish">
          完成
        </Button>
      </div>
    </template>
  </Modal>
</template>
