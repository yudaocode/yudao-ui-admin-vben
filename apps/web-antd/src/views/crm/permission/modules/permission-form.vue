<script lang="ts" setup>
import type { CrmPermissionApi } from '#/api/crm/permission';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  BizTypeEnum,
  createPermission,
  PermissionLevelEnum,
  updatePermission,
} from '#/api/crm/permission';
import { getSimpleUserList } from '#/api/system/user';
import { $t } from '#/locales';
import { DICT_TYPE, getDictOptions } from '#/utils';

const emit = defineEmits(['success']);
const formData = ref<CrmPermissionApi.Permission>();
const getTitle = computed(() => {
  return formData.value?.ids
    ? $t('ui.actionTitle.edit', ['团队成员'])
    : $t('ui.actionTitle.create', ['团队成员']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 80,
  },
  layout: 'horizontal',
  schema: [
    {
      fieldName: 'ids',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'userId',
      label: '选择人员',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleUserList,
        labelField: 'nickname',
        valueField: 'id',
      },
      dependencies: {
        triggerFields: ['ids'],
        show: (values) => {
          return values.ids === undefined;
        },
      },
    },
    {
      fieldName: 'level',
      label: '权限级别',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(
          DICT_TYPE.CRM_PERMISSION_LEVEL,
          'number',
        ).filter((dict) => dict.value !== PermissionLevelEnum.OWNER),
      },
      rules: 'required',
    },
    {
      fieldName: 'toBizTypes',
      label: '同时添加至',
      component: 'CheckboxGroup',
      componentProps: {
        options: [
          {
            label: '联系人',
            value: BizTypeEnum.CRM_CONTACT,
          },
          {
            label: '商机',
            value: BizTypeEnum.CRM_BUSINESS,
          },
          {
            label: '合同',
            value: BizTypeEnum.CRM_CONTRACT,
          },
        ],
      },
      dependencies: {
        triggerFields: ['ids', 'bizType'],
        show: (values) => {
          return (
            values.ids === undefined &&
            formData.value?.bizType === BizTypeEnum.CRM_CUSTOMER
          );
        },
      },
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    let data = (await formApi.getValues()) as CrmPermissionApi.Permission;
    data = Object.assign(data, formData.value);
    try {
      await (formData.value?.ids
        ? updatePermission(data)
        : createPermission(data));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
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
    const data = modalApi.getData();
    if (!data || !data.bizType || !data.bizId) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = {
        ids: data.ids || [data.id] || undefined,
        userId: undefined,
        bizType: data.bizType,
        bizId: data.bizId,
        level: data.level,
      };
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal class="w-[600px]" :title="getTitle">
    <Form class="mx-4" />
  </Modal>
</template>
