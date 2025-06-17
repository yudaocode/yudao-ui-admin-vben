<script lang="ts" setup>
import type { CrmFollowUpApi } from '#/api/crm/followup';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { getBusinessPageByCustomer } from '#/api/crm/business';
import { getContactPageByCustomer } from '#/api/crm/contact';
import { createFollowUpRecord } from '#/api/crm/followup';
import { $t } from '#/locales';
import { DICT_TYPE, getDictOptions } from '#/utils';

const emit = defineEmits(['success']);

const bizId = ref<number>();
const bizType = ref<number>();

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 120,
  },
  layout: 'horizontal',
  schema: [
    {
      component: 'Input',
      fieldName: 'bizId',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      component: 'Input',
      fieldName: 'bizType',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'type',
      label: '跟进类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.CRM_FOLLOW_UP_TYPE, 'number'),
      },
      rules: 'required',
    },
    {
      fieldName: 'nextTime',
      label: '下次联系时间',
      component: 'DatePicker',
      componentProps: {
        showTime: false,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
      rules: 'required',
    },
    {
      fieldName: 'content',
      label: '跟进内容',
      component: 'Textarea',
      rules: 'required',
    },
    {
      fieldName: 'picUrls',
      label: '图片',
      component: 'ImageUpload',
    },
    {
      fieldName: 'fileUrls',
      label: '附件',
      component: 'FileUpload',
    },
    {
      fieldName: 'contactIds',
      label: '关联联系人',
      component: 'ApiSelect',
      componentProps: {
        api: async () => {
          const res = await getContactPageByCustomer({
            pageNo: 1,
            pageSize: 100,
            customerId: bizId.value,
          });
          return res.list;
        },
        mode: 'multiple',
        fieldNames: { label: 'name', value: 'id' },
      },
    },
    {
      fieldName: 'businessIds',
      label: '关联商机',
      component: 'ApiSelect',
      componentProps: {
        api: async () => {
          const res = await getBusinessPageByCustomer({
            pageNo: 1,
            pageSize: 100,
            customerId: bizId.value,
          });
          return res.list;
        },
        mode: 'multiple',
        fieldNames: { label: 'name', value: 'id' },
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
    const data = (await formApi.getValues()) as CrmFollowUpApi.FollowUpRecord;
    try {
      await createFollowUpRecord(data);
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
      return;
    }
    // 加载数据
    const data = modalApi.getData<CrmFollowUpApi.FollowUpRecord>();
    if (!data) {
      return;
    }
    if (data.bizId && data.bizType) {
      bizId.value = data.bizId;
      bizType.value = data.bizType;
    }
    modalApi.lock();
    try {
      await formApi.setValues(data);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal title="添加跟进记录" class="w-2/5">
    <Form class="mx-4" />
  </Modal>
</template>
