<script lang="ts" setup>
import type { FormType } from '../data';

import type { MesWmPackageApi } from '#/api/mes/wm/packages';

import { computed, ref } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { MesWmPackageStatusEnum } from '@vben/constants';

import { Button, message, Tabs } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createPackage,
  finishPackage,
  getPackage,
  updatePackage,
} from '#/api/mes/wm/packages';
import { $t } from '#/locales';

import { useFormSchema } from '../data';
import PackageLineList from './package-line-list.vue';
import SubPackageList from './sub-package-list.vue';

const emit = defineEmits(['success']);
const formType = ref<FormType>('create');
const formData = ref<MesWmPackageApi.Package>();
const subTabsName = ref('subPackage'); // 子表当前 tab
const originalSnapshot = ref(''); // 表单原始数据快照，用于 finish 时跳过未变更的保存请求

const isEditable = computed(() =>
  ['create', 'update'].includes(formType.value),
);
const canFinish = computed(
  () =>
    formType.value === 'update' &&
    formData.value?.status === MesWmPackageStatusEnum.PREPARE,
);
const getTitle = computed(() => {
  if (formType.value === 'detail') {
    return $t('ui.actionTitle.view', ['装箱单']);
  }
  return formType.value === 'update'
    ? $t('ui.actionTitle.edit', ['装箱单'])
    : $t('ui.actionTitle.create', ['装箱单']);
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

/** 提交表单（create/update），新增成功后切换为编辑态以继续维护子表 */
async function handleSubmit(): Promise<boolean> {
  const { valid } = await formApi.validate();
  if (!valid) {
    return false;
  }
  const data = (await formApi.getValues()) as MesWmPackageApi.Package;
  if (formData.value?.id) {
    await updatePackage({ ...data, id: formData.value.id });
    formData.value = { ...formData.value, ...data };
  } else {
    const id = await createPackage(data);
    formData.value = {
      ...data,
      id,
      status: MesWmPackageStatusEnum.PREPARE,
    };
    await formApi.setFieldValue('id', id);
    await formApi.setFieldValue('status', MesWmPackageStatusEnum.PREPARE);
    formType.value = 'update';
  }
  // 刷新快照，下次 finish 用于判断是否需要再保存
  originalSnapshot.value = JSON.stringify(await formApi.getValues());
  return true;
}

/** 完成装箱单：编辑态有修改时先保存，再调用完成接口 */
async function handleFinish() {
  const id = formData.value?.id;
  if (!id) {
    return;
  }
  try {
    await confirm('确认完成该装箱单？完成后将不可编辑。');
  } catch {
    return;
  }
  const { valid } = await formApi.validate();
  if (!valid) {
    return;
  }
  modalApi.lock();
  try {
    const current = JSON.stringify(await formApi.getValues());
    if (current !== originalSnapshot.value) {
      const data = (await formApi.getValues()) as MesWmPackageApi.Package;
      await updatePackage({ ...data, id });
      originalSnapshot.value = current;
    }
    await finishPackage(id);
    message.success('完成成功');
    await modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (formType.value === 'detail') {
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
    subTabsName.value = 'subPackage';
    // 加载数据
    const data = modalApi.getData<{ formType: FormType; id?: number }>();
    formType.value = data.formType;
    formApi.setState({ schema: useFormSchema(formType.value, formApi) });
    formApi.setDisabled(formType.value === 'detail');
    modalApi.setState({ showConfirmButton: formType.value !== 'detail' });
    if (data?.id) {
      modalApi.lock();
      try {
        formData.value = await getPackage(data.id);
        // 设置到 values
        await formApi.setValues(formData.value);
      } finally {
        modalApi.unlock();
      }
    }
    // 记录初始快照，后续 finish 用于判断是否需要再保存
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
    >
      <Tabs.TabPane key="subPackage" tab="子箱">
        <SubPackageList :editable="isEditable" :package-id="formData.id" />
      </Tabs.TabPane>
      <Tabs.TabPane key="packageLine" tab="装箱清单">
        <PackageLineList :editable="isEditable" :package-id="formData.id" />
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
