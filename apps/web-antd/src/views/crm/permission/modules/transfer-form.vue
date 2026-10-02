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
import { BizTypeEnum } from '#/api/crm/permission';
import { $t } from '#/locales';

import { useTransferFormSchema } from './data';

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
  schema: useTransferFormSchema(),
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
    const data =
      (await formApi.getValues()) as CrmPermissionApi.BusinessTransferReqVO;
    try {
      switch (bizType.value) {
        case BizTypeEnum.CRM_BUSINESS: {
          await transferBusiness(data);
          break;
        }
        case BizTypeEnum.CRM_CLUE: {
          await transferClue(data);
          break;
        }
        case BizTypeEnum.CRM_CONTACT: {
          await transferContact(data);
          break;
        }
        case BizTypeEnum.CRM_CONTRACT: {
          await transferContract(data);
          break;
        }
        case BizTypeEnum.CRM_CUSTOMER: {
          await transferCustomer(data);
          break;
        }
        default: {
          message.error('【转移失败】没有转移接口');
          return;
        }
      }
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
    const data = modalApi.getData() as { bizType: number; id: number };
    if (!data || !data.id || !data.bizType) {
      return;
    }
    bizType.value = data.bizType;
    await formApi.setFieldValue('id', data.id);
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-2/5">
    <Form class="mx-4" />
  </Modal>
</template>
