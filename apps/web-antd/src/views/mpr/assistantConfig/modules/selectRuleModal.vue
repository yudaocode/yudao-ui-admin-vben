<script lang="ts" setup>
import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { getSimpleTagList } from '#/api/mpr/tag';

defineOptions({
  name: 'SelectRuleFormModel',
});

const emit = defineEmits(['success']);

const [Form, formApi] = useVbenForm({
  handleSubmit: onSubmit,
  commonConfig: {
    componentProps: {
      // class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 120,
  },
  schema: [
    {
      fieldName: 'priceSwitch',
      label: '价格区间',
      component: 'Switch',
      componentProps: {
        placeholder: '请输入',
      },
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入',
        addonBefore: '最低价格',
      },
      fieldName: 'field1',
      dependencies: {
        triggerFields: ['priceSwitch'],
        show: (value) => !!value.priceSwitch,
      },
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入',
        addonBefore: '最高价格',
      },
      fieldName: 'field2',
      dependencies: {
        triggerFields: ['priceSwitch'],
        show: (value) => !!value.priceSwitch,
      },
    },
    {
      fieldName: 'distanceSwitch',
      label: '距离范围',
      component: 'Switch',
      componentProps: {
        placeholder: '请输入',
      },
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入',
        addonBefore: '最低距离',
      },
      fieldName: 'field1',
      dependencies: {
        triggerFields: ['distanceSwitch'],
        show: (value) => !!value.distanceSwitch,
      },
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入',
        addonBefore: '最远距离',
      },
      fieldName: 'field2',
      dependencies: {
        triggerFields: ['distanceSwitch'],
        show: (value) => !!value.distanceSwitch,
      },
    },
    {
      fieldName: 'excludeSwitch',
      label: '排除条件',
      component: 'Switch',
      componentProps: {
        placeholder: '请输入',
      },
    },
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        mode: 'multiple',
        showArrow: true,
        api: () => getSimpleTagList(),
        fieldNames: {
          label: 'name',
          value: 'id',
        },
        options: [
          { label: '选项1', value: '1' },
          { label: '选项2', value: '2' },
        ],
        placeholder: '卖家标签包含',
        class: 'w-2/3',
      },
      help: '排除卖家标签包含',
      // suffix: '卖家标签包含',
      fieldName: 'excludeSellerTag',
      // label: '卖家标签包含',
      dependencies: {
        triggerFields: ['excludeSwitch'],
        show: (value) => !!value.excludeSwitch,
      },
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入卖家账号年龄',
        addonBefore: '卖家号龄低于',
        addonAfter: '月',
      },
      fieldName: 'excludeSellerAccountAgeBelow',
      help: '排除卖家号龄低于',
      dependencies: {
        triggerFields: ['excludeSwitch'],
        show: (value) => !!value.excludeSwitch,
      },
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入卖家评分',
        addonBefore: '卖家评分低于',
        addonAfter: '分',
      },
      fieldName: 'excludeSellerRatingBelow',
      help: '排除卖家评分低于',
      dependencies: {
        triggerFields: ['excludeSwitch'],
        show: (value) => !!value.excludeSwitch,
      },
    },
    {
      component: 'DatePicker',
      componentProps: {
        placeholder: '发布时间早于',
        addonBefore: '发布时间早于',
        showTime: false,
        format: 'YYYY-MM-DD',
        valueFormat: 'x',
      },
      fieldName: 'excludeDateBefore',
      help: '排除发布时间早于',
      dependencies: {
        triggerFields: ['excludeSwitch'],
        show: (value) => !!value.excludeSwitch,
      },
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    await formApi.validateAndSubmitForm();
    // modalApi.close();
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const data = modalApi.getData<Record<string, any>>();

      if (data) {
        formApi.setValues(data, false);
      }
    }
  },
  title: '意向商品选择规则',
});
function onSubmit(values: Record<string, any>) {
  modalApi.lock();
  modalApi.close();
  emit('success', values);
}
</script>
<template>
  <Modal>
    <Form />
  </Modal>
</template>
