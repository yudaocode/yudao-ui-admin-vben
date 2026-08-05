<script lang="ts" setup>
import type { Rule } from 'antdv-next';

import type { HrmSalaryOptionApi } from '#/api/hrm/salary/config/option';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Form, FormItem, Input, message, Select } from 'antdv-next';

import {
  createSalaryOption,
  getSalaryOptionList,
} from '#/api/hrm/salary/config/option';
import { $t } from '#/locales';
import { HrmSalaryOptionCategoryCode } from '#/views/hrm/utils/constants';

defineOptions({ name: 'HrmSalaryOptionForm' });

const emit = defineEmits(['success']);

const formRef = ref();
const optionList = ref<HrmSalaryOptionApi.SalaryOption[]>([]);
const formData = ref<HrmSalaryOptionApi.SaveReq>({
  parentCode: undefined,
  name: '',
  remark: '',
});

const categoryList = computed(() =>
  optionList.value.filter(
    (item) =>
      item.parentCode === HrmSalaryOptionCategoryCode.ROOT &&
      !item.systemFlag &&
      item.enabled,
  ),
);

const formRules: Record<string, Rule[]> = {
  parentCode: [
    { required: true, message: '工资项分类不能为空', trigger: 'change' },
  ],
  name: [{ required: true, message: '工资项名称不能为空', trigger: 'blur' }],
};

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    await formRef.value?.validate();
    modalApi.lock();
    try {
      await createSalaryOption(formData.value);
      message.success($t('ui.actionMessage.operationSuccess'));
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) return;
    const parentCode = modalApi.getData<{ parentCode: number }>()?.parentCode;
    optionList.value = await getSalaryOptionList();
    formData.value = { parentCode, name: '', remark: '' };
  },
});
</script>

<template>
  <Modal :title="$t('ui.actionTitle.create', ['工资项'])" class="w-[560px]">
    <Form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      class="mx-4"
      label-width="96px"
    >
      <FormItem label="工资项分类" name="parentCode">
        <Select
          v-model:value="formData.parentCode"
          :options="
            categoryList.map((item) => ({ label: item.name, value: item.code }))
          "
          disabled
          class="w-full"
          placeholder="请选择工资项分类"
        />
      </FormItem>
      <FormItem label="工资项名称" name="name">
        <Input
          v-model:value="formData.name"
          :maxlength="64"
          placeholder="请输入工资项名称"
        />
      </FormItem>
      <FormItem label="备注" name="remark">
        <Input.TextArea
          v-model:value="formData.remark"
          :rows="3"
          :maxlength="255"
          placeholder="请输入备注"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
