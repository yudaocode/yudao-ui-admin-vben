<script lang="ts" setup>
import type { FmsAuxiliaryItemApi } from '#/api/fms/config/auxiliary/item';
import type { FmsAuxiliaryTypeApi } from '#/api/fms/config/auxiliary/type';

import { computed, ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import {
  createAuxiliaryItem,
  updateAuxiliaryItem,
} from '#/api/fms/config/auxiliary/item';
import { $t } from '#/locales';
import { useFmsStore } from '#/views/fms/store/fms';
import { FMS_AUXILIARY_TYPE } from '#/views/fms/utils/constants';

import { useItemFormSchema } from '../data';

defineOptions({ name: 'FmsAuxiliaryItemForm' });

const emit = defineEmits(['success']);

const fmsStore = useFmsStore();

const auxiliaryType = ref<FmsAuxiliaryTypeApi.AuxiliaryType>(); // 当前辅助核算类别
const formData = ref<FmsAuxiliaryItemApi.AuxiliaryItem>(); // 编辑时的项目

const isInventory = computed(
  () => auxiliaryType.value?.type === FMS_AUXILIARY_TYPE.INVENTORY,
); // 是否存货类别
const getTitle = computed(() =>
  formData.value?.id ? '编辑辅助核算' : `新增${auxiliaryType.value?.name}`,
);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 88,
  },
  layout: 'horizontal',
  schema: useItemFormSchema(false),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    const accountSetId = fmsStore.getAccountSetId;
    if (!accountSetId || !auxiliaryType.value?.id) {
      return;
    }
    modalApi.lock();
    const values = await formApi.getValues();
    const data: FmsAuxiliaryItemApi.AuxiliaryItem = {
      ...formData.value,
      accountSetId,
      auxiliaryTypeId: auxiliaryType.value.id,
      code: values.code,
      name: values.name,
      remark: values.remark,
      specification: values.specification,
      unit: values.unit,
    };
    try {
      await (formData.value?.id
        ? updateAuxiliaryItem(data)
        : createAuxiliaryItem(data));
      await modalApi.close();
      emit('success');
      ElMessage.success(
        $t(
          formData.value?.id
            ? 'ui.actionMessage.updateSuccess'
            : 'ui.actionMessage.createSuccess',
        ),
      );
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      auxiliaryType.value = undefined;
      return;
    }
    const data = modalApi.getData<{
      auxiliaryType: FmsAuxiliaryTypeApi.AuxiliaryType;
      row?: FmsAuxiliaryItemApi.AuxiliaryItem;
    }>();
    auxiliaryType.value = data.auxiliaryType;
    formData.value = data.row;
    // 存货类别展示规格、单位；schema 之外的字段不会随表单提交，等价于源项目提交前清空
    await formApi.setState({ schema: useItemFormSchema(isInventory.value) });
    await formApi.setValues(
      data.row ? { ...data.row } : { code: '', name: '', remark: '' },
    );
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[520px]">
    <Form class="mx-4" />
  </Modal>
</template>
