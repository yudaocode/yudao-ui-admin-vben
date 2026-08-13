<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import type { FmsVoucherTemplateApi } from '#/api/fms/config/voucher-template';
import type { FmsVoucherTemplateCategoryApi } from '#/api/fms/config/voucher-template-category';

import { nextTick, reactive, ref } from 'vue';

import { useAccess } from '@vben/access';
import { confirm } from '@vben/common-ui';

import {
  ElButton,
  ElCheckbox,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import { createVoucherTemplate } from '#/api/fms/config/voucher-template';
import {
  createVoucherTemplateCategory,
  deleteVoucherTemplateCategory,
  getVoucherTemplateCategorySimpleList,
  updateVoucherTemplateCategory,
} from '#/api/fms/config/voucher-template-category';
import { useFmsStore } from '#/views/fms/store/fms';

defineOptions({ name: 'FmsVoucherTemplateSaveForm' });

const emit = defineEmits<{ success: [] }>();

const { hasAccessByCodes } = useAccess();
const fmsStore = useFmsStore(); // FMS Store

const dialogVisible = ref(false); // 弹窗的是否展示
const categoryDialogVisible = ref(false); // 模板分类弹窗的是否展示
const submitting = ref(false); // 表单提交的加载中
const categorySubmitting = ref(false); // 模板分类提交的加载中
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
  categoryId: [{ required: true, message: '请选择模板分类', trigger: 'change' }],
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
};
const categoryFormRef = ref<FormInstance>(); // 模板分类表单 Ref
const categoryFormData = reactive({
  id: undefined as number | undefined,
  name: '',
});
const categoryFormRules: FormRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
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
  resetCategoryForm();

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

/** 编辑模板分类 */
function editCategory(
  row: FmsVoucherTemplateCategoryApi.VoucherTemplateCategory,
) {
  categoryFormData.id = row.id;
  categoryFormData.name = row.name;
  nextTick(() => categoryFormRef.value?.clearValidate());
}

/** 重置模板分类表单 */
function resetCategoryForm() {
  categoryFormData.id = undefined;
  categoryFormData.name = '';
  categoryFormRef.value?.clearValidate();
}

/** 保存模板分类 */
async function saveCategory() {
  // 1. 校验分类表单
  if (!accountSetId.value || !categoryFormRef.value) return;
  try {
    await categoryFormRef.value.validate();
  } catch {
    return;
  }

  // 2. 新增或修改模板分类
  categorySubmitting.value = true;
  try {
    if (categoryFormData.id) {
      await updateVoucherTemplateCategory({
        id: categoryFormData.id,
        accountSetId: accountSetId.value,
        name: categoryFormData.name,
      });
      ElMessage.success('修改成功');
    } else {
      formData.categoryId = await createVoucherTemplateCategory({
        accountSetId: accountSetId.value,
        name: categoryFormData.name,
      });
      ElMessage.success('新增成功');
    }

    // 3. 重置分类表单并刷新分类列表
    resetCategoryForm();
    await getCategoryList();
  } finally {
    categorySubmitting.value = false;
  }
}

/** 删除模板分类 */
async function deleteCategory(
  row: FmsVoucherTemplateCategoryApi.VoucherTemplateCategory,
) {
  if (!accountSetId.value) return;
  try {
    // 1. 删除模板分类
    await confirm('确认删除该模板分类吗？');
    await deleteVoucherTemplateCategory(accountSetId.value, row.id!);
    if (formData.categoryId === row.id) formData.categoryId = undefined;
    ElMessage.success('删除成功');

    // 2. 刷新模板分类列表
    await getCategoryList();
  } catch {
    // 取消删除
  }
}

/** 选择模板分类 */
function selectCategory(
  row: FmsVoucherTemplateCategoryApi.VoucherTemplateCategory,
) {
  formData.categoryId = row.id;
  categoryDialogVisible.value = false;
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
        <div class="flex w-full gap-2 [&_.el-select]:flex-1">
          <ElSelect
            v-model="formData.categoryId"
            placeholder="请选择模板分类"
          >
            <ElOption
              v-for="item in categories"
              :key="item.id"
              :label="item.name"
              :value="item.id!"
            />
          </ElSelect>
          <ElButton @click="categoryDialogVisible = true">管理分类</ElButton>
        </div>
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

  <ElDialog
    v-model="categoryDialogVisible"
    title="凭证模板分类"
    width="560px"
  >
    <ElForm
      ref="categoryFormRef"
      class="mb-4 flex w-full gap-2 [&_.el-form-item]:!mb-0 [&_.el-form-item]:flex-1"
      :model="categoryFormData"
      :rules="categoryFormRules"
    >
      <ElFormItem prop="name">
        <ElInput
          v-model="categoryFormData.name"
          :maxlength="255"
          placeholder="请输入分类名称"
        />
      </ElFormItem>
      <div class="flex">
        <ElButton
          v-if="
            categoryFormData.id &&
            fmsStore.isAccountSetWritable &&
            hasAccessByCodes(['fms:config:voucher-template-category:update'])
          "
          :loading="categorySubmitting"
          type="primary"
          @click="saveCategory"
        >
          保存
        </ElButton>
        <ElButton
          v-else-if="
            fmsStore.isAccountSetWritable &&
            hasAccessByCodes(['fms:config:voucher-template-category:create'])
          "
          :loading="categorySubmitting"
          type="primary"
          @click="saveCategory"
        >
          新增
        </ElButton>
        <ElButton v-if="categoryFormData.id" @click="resetCategoryForm">
          取消
        </ElButton>
      </div>
    </ElForm>
    <ElTable
      :data="categories"
      border
      stripe
      @row-dblclick="(row) => selectCategory(row as FmsVoucherTemplateCategoryApi.VoucherTemplateCategory)"
    >
      <ElTableColumn label="分类名称" min-width="260" prop="name" />
      <ElTableColumn align="center" label="操作" width="150">
        <template #default="{ row }">
          <ElButton
            v-if="
              fmsStore.isAccountSetWritable &&
              hasAccessByCodes(['fms:config:voucher-template-category:update'])
            "
            link
            type="primary"
            @click="editCategory(row as FmsVoucherTemplateCategoryApi.VoucherTemplateCategory)"
          >
            编辑
          </ElButton>
          <ElButton
            v-if="
              fmsStore.isAccountSetWritable &&
              hasAccessByCodes(['fms:config:voucher-template-category:delete'])
            "
            link
            type="danger"
            @click="deleteCategory(row as FmsVoucherTemplateCategoryApi.VoucherTemplateCategory)"
          >
            删除
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>
    <div class="mt-2.5 text-xs text-gray-400">双击分类可直接选中</div>
  </ElDialog>
</template>
