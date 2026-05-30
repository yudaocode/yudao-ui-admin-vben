<script lang="ts" setup>
import type { FormType } from '../data';

import type { MesQcIpqcApi } from '#/api/mes/qc/ipqc';

import { computed, ref } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { MesQcStatusEnum, MesQcTypeEnum } from '@vben/constants';

import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElMessage,
  ElTabPane,
  ElTabs,
} from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createIpqc,
  finishIpqc,
  getIpqc,
  updateIpqc,
} from '#/api/mes/qc/ipqc';
import { $t } from '#/locales';

import { QcIndicatorResultList } from '../../indicatorresult/components';
import { useFormSchema } from '../data';
import LineList from './line-list.vue';

const emit = defineEmits(['success']);
const formType = ref<FormType>('create');
const formData = ref<MesQcIpqcApi.Ipqc>();
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
    return $t('ui.actionTitle.view', ['过程检验单']);
  }
  return formType.value === 'update'
    ? $t('ui.actionTitle.edit', ['过程检验单'])
    : $t('ui.actionTitle.create', ['过程检验单']);
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
  formData.value = await getIpqc(formData.value.id);
}

/** 提交表单 */
async function handleSubmit(): Promise<boolean> {
  const { valid } = await formApi.validate();
  if (!valid) {
    return false;
  }
  const data = (await formApi.getValues()) as MesQcIpqcApi.Ipqc;
  if (formData.value?.id) {
    await updateIpqc({ ...data, id: formData.value.id });
    formData.value = { ...formData.value, ...data };
  } else {
    const id = await createIpqc(data);
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
    await confirm('是否完成过程检验单编制？【完成后将不能更改】');
  } catch {
    return;
  }
  modalApi.lock();
  try {
    const current = JSON.stringify(await formApi.getValues());
    if (current !== originalSnapshot.value) {
      const data = (await formApi.getValues()) as MesQcIpqcApi.Ipqc;
      await updateIpqc({ ...data, id });
      formData.value = { ...formData.value, ...data };
      originalSnapshot.value = current;
    }
    await finishIpqc(id);
    ElMessage.success('完成成功');
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
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
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
      prefill?: MesQcIpqcApi.Ipqc;
    }>();
    formType.value = data.formType;
    formApi.setState({ schema: useFormSchema(formType.value, formApi) });
    formApi.setDisabled(formType.value === 'detail');
    modalApi.setState({ showConfirmButton: formType.value !== 'detail' });
    if (data?.id) {
      modalApi.lock();
      try {
        formData.value = await getIpqc(data.id);
        // 设置到 values
        await formApi.setValues(formData.value);
      } finally {
        modalApi.unlock();
      }
    } else if (data?.prefill) {
      // 预填模式：来自待检任务
      formData.value = { ...data.prefill };
      // 设置到 values
      await formApi.setValues(data.prefill);
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
      <ElDescriptions title="缺陷情况" :column="3" border size="small">
        <ElDescriptionsItem label="致命缺陷数">
          {{ formData.criticalQuantity ?? 0 }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="严重缺陷数">
          {{ formData.majorQuantity ?? 0 }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="轻微缺陷数">
          {{ formData.minorQuantity ?? 0 }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="致命缺陷率">
          {{ formData.criticalRate ?? 0 }}%
        </ElDescriptionsItem>
        <ElDescriptionsItem label="严重缺陷率">
          {{ formData.majorRate ?? 0 }}%
        </ElDescriptionsItem>
        <ElDescriptionsItem label="轻微缺陷率">
          {{ formData.minorRate ?? 0 }}%
        </ElDescriptionsItem>
      </ElDescriptions>
    </div>
    <ElTabs v-if="formData?.id" v-model="subTabsName" class="mx-4 mt-4">
      <ElTabPane label="检验项" name="line">
        <LineList
          :form-type="formType"
          :ipqc-id="formData.id"
          @refresh="handleRefresh"
        />
      </ElTabPane>
      <ElTabPane label="检测结果" name="result">
        <QcIndicatorResultList
          :qc-id="formData.id"
          :qc-type="MesQcTypeEnum.IPQC"
          :readonly="isDetail"
        />
      </ElTabPane>
    </ElTabs>
    <template #prepend-footer>
      <div class="flex flex-auto items-center gap-2">
        <ElButton v-if="canFinish" type="primary" @click="handleFinish">
          完成
        </ElButton>
      </div>
    </template>
  </Modal>
</template>
