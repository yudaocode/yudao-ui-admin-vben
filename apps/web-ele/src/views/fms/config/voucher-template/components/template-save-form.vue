<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import type { FmsVoucherTemplateApi } from '#/api/fms/config/voucher-template';
import type { FmsVoucherTemplateCategoryApi } from '#/api/fms/config/voucher-template-category';

import { reactive, ref } from 'vue';

import {
  ElButton,
  ElCheckbox,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
} from 'element-plus';

import { createVoucherTemplate } from '#/api/fms/config/voucher-template';
import { getVoucherTemplateCategorySimpleList } from '#/api/fms/config/voucher-template-category';

import CategorySelect from './category-select.vue';

defineOptions({ name: 'FmsVoucherTemplateSaveForm' });

const emit = defineEmits<{ success: [] }>();

const dialogVisible = ref(false); // 弹窗的是否展示
const submitting = ref(false); // 表单提交的加载中
const accountSetId = ref<number>(); // 当前账套编号
const sourceEntries = ref<FmsVoucherTemplateApi.VoucherTemplateEntry[]>([]); // 来源凭证分录数组
const categories = ref<FmsVoucherTemplateCategoryApi.VoucherTemplateCategory[]>(
  [],
); // 模板分类列表
const saveMoney = ref(false); // 是否保存数量、单价和借贷金额
const formRef = ref<FormInstance>(); // 表单 Ref
const formData = reactive({
  categoryId: undefined as number | undefined,
  name: '',
});
const formRules: FormRules = {
  categoryId: [
    { required: true, message: '请选择模板分类', trigger: 'change' },
  ],
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
};

/** 打开弹窗 */
async function open(
  id: number,
  entries: FmsVoucherTemplateApi.VoucherTemplateEntry[],
) {
  // 1. 保存账套和来源凭证分录
  accountSetId.value = id;
  sourceEntries.value = entries.map((entry) => ({
    ...entry,
    auxiliaries: entry.auxiliaries.map((item) => ({ ...item })),
  }));

  // 2. 重置模板和分类表单
  formData.categoryId = undefined;
  formData.name = '';
  saveMoney.value = false;

  // 3. 查询模板分类并默认选择首个分类
  await getCategoryList();
  formData.categoryId = categories.value[0]?.id;
  dialogVisible.value = true;
}

/** 查询模板分类列表 */
async function getCategoryList() {
  if (!accountSetId.value) return;
  categories.value = await getVoucherTemplateCategorySimpleList(
    accountSetId.value,
  );
}

/** 同步模板分类列表，并清理已删除的当前选项 */
function handleCategoryChange(
  nextCategories: FmsVoucherTemplateCategoryApi.VoucherTemplateCategory[],
) {
  categories.value = nextCategories;
  if (
    formData.categoryId &&
    !nextCategories.some((item) => item.id === formData.categoryId)
  ) {
    formData.categoryId = undefined;
  }
}

/** 提交表单 */
async function submitForm() {
  // 1. 校验模板表单
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
  } catch {
    return;
  }
  if (!accountSetId.value || !formData.categoryId) return;

  // 2. 保存凭证模板
  submitting.value = true;
  try {
    await createVoucherTemplate({
      accountSetId: accountSetId.value,
      categoryId: formData.categoryId,
      name: formData.name,
      entries: sourceEntries.value.map((entry) => ({
        ...entry,
        quantity: saveMoney.value ? entry.quantity : undefined,
        unitPrice: saveMoney.value ? entry.unitPrice : undefined,
        debitAmount: saveMoney.value ? entry.debitAmount : undefined,
        creditAmount: saveMoney.value ? entry.creditAmount : undefined,
        auxiliaries: entry.auxiliaries.map((item) => ({
          typeId: item.typeId,
          itemId: item.itemId,
        })),
      })),
    });
    ElMessage.success('保存成功');
    dialogVisible.value = false;
    emit('success');
  } finally {
    submitting.value = false;
  }
}

defineExpose({ open });
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    destroy-on-close
    title="新增凭证模板"
    width="480px"
  >
    <ElForm
      ref="formRef"
      label-width="90px"
      :model="formData"
      :rules="formRules"
    >
      <ElFormItem label="模板分类" prop="categoryId">
        <CategorySelect
          v-model="formData.categoryId"
          :account-set-id="accountSetId"
          :categories="categories"
          @change="handleCategoryChange"
        />
      </ElFormItem>
      <ElFormItem label="模板名称" prop="name">
        <ElInput
          v-model="formData.name"
          :maxlength="255"
          placeholder="请输入模板名称"
        />
      </ElFormItem>
      <ElFormItem label="保存金额">
        <ElCheckbox v-model="saveMoney">保留数量、单价和借贷金额</ElCheckbox>
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton :loading="submitting" type="primary" @click="submitForm">
        确 定
      </ElButton>
      <ElButton @click="dialogVisible = false">取 消</ElButton>
    </template>
  </ElDialog>
</template>
