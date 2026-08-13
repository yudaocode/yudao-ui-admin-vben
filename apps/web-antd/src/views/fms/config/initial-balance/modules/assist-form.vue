<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { FmsAuxiliaryItemApi } from '#/api/fms/config/auxiliary/item';
import type { FmsInitialBalanceApi } from '#/api/fms/config/initial-balance';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import FmsAuxiliaryItemSelect from '#/views/fms/config/auxiliary/components/auxiliary-item-select.vue';

defineOptions({ name: 'FmsInitialAssistForm' });

const emit = defineEmits<{
  success: [combinations: FmsAuxiliaryItemApi.AuxiliaryItemOption[][]];
}>();

const subject = ref<FmsInitialBalanceApi.InitialBalance>(); // 当前科目
const selectedItems = ref<
  Record<number, FmsAuxiliaryItemApi.AuxiliaryItemOption[]>
>({}); // 各类别选中的项目
const selectedIds = ref<Record<number, number[]>>({}); // 各类别选中的项目编号（选择器 v-model）

/** 构建表单 schema：科目展示 + 按辅助核算配置动态生成项目多选 */
function useFormSchema(
  row: FmsInitialBalanceApi.InitialBalance,
): VbenFormSchema[] {
  return [
    {
      fieldName: 'subject',
      label: '科目',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'assistDivider',
      component: 'Divider',
      label: '',
      renderComponentContent: () => ({
        default: () => ['辅助核算'],
      }),
    },
    ...row.auxiliaryConfigs.map(
      (config): VbenFormSchema => ({
        fieldName: `items_${config.auxiliaryTypeId}`,
        label: config.name,
        component: 'Input',
        rules: 'selectRequired',
      }),
    ),
  ];
}

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 110,
  },
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    if (!subject.value) return;
    // 校验每个辅助核算类别至少选择一个项目
    for (const config of subject.value.auxiliaryConfigs) {
      if (!selectedItems.value[config.auxiliaryTypeId]?.length) {
        message.warning(`请选择${config.name}`);
        return;
      }
    }
    // 发送操作成功的事件
    const itemGroups = subject.value.auxiliaryConfigs.map(
      (config) => selectedItems.value[config.auxiliaryTypeId] || [],
    );
    emit('success', buildCombinations(itemGroups));
    await modalApi.close();
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      subject.value = undefined;
      selectedItems.value = {};
      selectedIds.value = {};
      return;
    }
    const data = modalApi.getData<FmsInitialBalanceApi.InitialBalance>();
    if (!data) return;
    subject.value = data;
    selectedItems.value = {};
    selectedIds.value = {};
    await formApi.setState({ schema: useFormSchema(data) });
    await formApi.setValues({
      subject: `${data.subjectCode} ${data.subjectName}`,
    });
  },
});

/**
 * 更新指定辅助核算类别的选中项目
 *
 * @param auxiliaryTypeId 辅助核算类别编号
 * @param items 当前类别选中的项目
 */
function handleItemsChange(
  auxiliaryTypeId: number,
  items:
    | FmsAuxiliaryItemApi.AuxiliaryItemOption
    | FmsAuxiliaryItemApi.AuxiliaryItemOption[]
    | undefined,
) {
  const itemList = Array.isArray(items) ? items : items ? [items] : [];
  selectedItems.value[auxiliaryTypeId] = itemList;
  // 同步表单值用于必填校验
  formApi.setFieldValue(
    `items_${auxiliaryTypeId}`,
    itemList.length ? itemList.map((item) => item.id) : undefined,
  );
}

/** 将各辅助类别的多选项目展开为组合 */
function buildCombinations(
  itemGroups: FmsAuxiliaryItemApi.AuxiliaryItemOption[][],
) {
  return itemGroups.reduce<FmsAuxiliaryItemApi.AuxiliaryItemOption[][]>(
    (combinations, items) =>
      combinations.flatMap((combination) =>
        items.map((item) => [...combination, item]),
      ),
    [[]],
  );
}
</script>

<template>
  <Modal title="添加明细" class="w-[520px]">
    <Form class="mx-4">
      <template
        v-for="config in subject?.auxiliaryConfigs || []"
        :key="config.auxiliaryTypeId"
        #[`items_${config.auxiliaryTypeId}`]
      >
        <FmsAuxiliaryItemSelect
          v-model="selectedIds[config.auxiliaryTypeId]"
          :auxiliary-type-id="config.auxiliaryTypeId"
          multiple
          :placeholder="`请选择${config.name}`"
          @change="(items) => handleItemsChange(config.auxiliaryTypeId, items)"
        />
      </template>
    </Form>
  </Modal>
</template>
