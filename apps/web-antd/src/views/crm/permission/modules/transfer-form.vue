<script lang="ts" setup>
import type { CrmPermissionApi } from '#/api/crm/permission';

import { computed } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { transferBusiness } from '#/api/crm/business';
import { transferClue } from '#/api/crm/clue';
import { transferContact } from '#/api/crm/contact';
import { transferContract } from '#/api/crm/contract';
import { transferCustomer } from '#/api/crm/customer';
import { BizTypeEnum, PermissionLevelEnum } from '#/api/crm/permission';
import { getSimpleUserList } from '#/api/system/user';
import { $t } from '#/locales';
import { DICT_TYPE, getDictOptions } from '#/utils';

defineOptions({ name: 'CrmTransferForm' });

const emit = defineEmits(['success']);

const bizType = defineModel<number>('bizType');

const getTitle = computed(() => {
  switch (bizType.value) {
    case BizTypeEnum.CRM_BUSINESS: {
      return '商机转移';
    }
    case BizTypeEnum.CRM_CLUE: {
      return '线索转移';
    }
    case BizTypeEnum.CRM_CONTACT: {
      return '联系人转移';
    }
    case BizTypeEnum.CRM_CONTRACT: {
      return '合同转移';
    }
    case BizTypeEnum.CRM_CUSTOMER: {
      return '客户转移';
    }
    default: {
      return '转移';
    }
  }
});

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
      fieldName: 'id',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'ownerUserId',
      label: '选择新负责人',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleUserList,
        labelField: 'nickname',
        valueField: 'id',
      },
      rules: 'required',
    },
    {
      fieldName: 'oldOwnerHandler',
      label: '老负责人',
      component: 'RadioGroup',
      componentProps: {
        options: [
          {
            label: '加入团队',
            value: true,
          },
          {
            label: '移除',
            value: false,
          },
        ],
      },
      rules: 'required',
    },
    {
      fieldName: 'oldOwnerPermissionLevel',
      label: '老负责人权限级别',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(
          DICT_TYPE.CRM_PERMISSION_LEVEL,
          'number',
        ).filter((dict) => dict.value !== PermissionLevelEnum.OWNER),
      },
      dependencies: {
        triggerFields: ['oldOwnerHandler'],
        show: (values) => values.oldOwnerHandler,
        trigger(values) {
          if (!values.oldOwnerHandler) {
            formApi.setFieldValue('oldOwnerPermissionLevel', undefined);
          }
        },
      },
      rules: 'required',
    },
    {
      fieldName: 'toBizTypes',
      label: '同时转移',
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
    const data = (await formApi.getValues()) as CrmPermissionApi.TransferReq;
    try {
      switch (bizType.value) {
        case BizTypeEnum.CRM_BUSINESS: {
          return await transferBusiness(data);
        }
        case BizTypeEnum.CRM_CLUE: {
          return await transferClue(data);
        }
        case BizTypeEnum.CRM_CONTACT: {
          return await transferContact(data);
        }
        case BizTypeEnum.CRM_CONTRACT: {
          return await transferContract(data);
        }
        case BizTypeEnum.CRM_CUSTOMER: {
          return await transferCustomer(data);
        }
        default: {
          message.error('【转移失败】没有转移接口');
          throw new Error('【转移失败】没有转移接口');
        }
      }
    } finally {
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formApi.resetForm();
      return;
    }
    // 加载数据
    const data = modalApi.getData<{ bizType: number }>();
    if (!data || !data.bizType) {
      return;
    }
    bizType.value = data.bizType;
    formApi.setFieldValue('id', data.bizType);
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[40%]">
    <Form class="mx-4" />
  </Modal>
</template>
