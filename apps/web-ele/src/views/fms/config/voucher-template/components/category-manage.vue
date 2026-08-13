<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import type { FmsVoucherTemplateCategoryApi } from '#/api/fms/config/voucher-template-category';

import { nextTick, reactive, ref } from 'vue';

import { useAccess } from '@vben/access';
import { confirm } from '@vben/common-ui';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import {
  createVoucherTemplateCategory,
  deleteVoucherTemplateCategory,
  getVoucherTemplateCategorySimpleList,
  updateVoucherTemplateCategory,
} from '#/api/fms/config/voucher-template-category';
import { useFmsStore } from '#/views/fms/store/fms';

defineOptions({ name: 'FmsVoucherTemplateCategoryManage' });

const props = defineProps<{ accountSetId?: number }>();
const emit = defineEmits<{
  change: [categories: FmsVoucherTemplateCategoryApi.VoucherTemplateCategory[]];
  select: [categoryId: number];
}>();

const { hasAccessByCodes } = useAccess();
const fmsStore = useFmsStore();
const visible = ref(false);
const submitting = ref(false);
const categories = ref<FmsVoucherTemplateCategoryApi.VoucherTemplateCategory[]>(
  [],
);
const formRef = ref<FormInstance>();
const formData = reactive({ id: undefined as number | undefined, name: '' });
const formRules: FormRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
};

async function open() {
  resetForm();
  visible.value = true;
  await getList();
}

async function getList() {
  categories.value = props.accountSetId
    ? await getVoucherTemplateCategorySimpleList(props.accountSetId)
    : [];
  emit('change', categories.value);
}

function editCategory(
  row: FmsVoucherTemplateCategoryApi.VoucherTemplateCategory,
) {
  formData.id = row.id;
  formData.name = row.name;
  nextTick(() => formRef.value?.clearValidate());
}

function resetForm() {
  formData.id = undefined;
  formData.name = '';
  formRef.value?.clearValidate();
}

async function saveCategory() {
  if (!props.accountSetId || !formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  submitting.value = true;
  try {
    if (formData.id) {
      await updateVoucherTemplateCategory({
        id: formData.id,
        accountSetId: props.accountSetId,
        name: formData.name,
      });
      ElMessage.success('修改成功');
    } else {
      const categoryId = await createVoucherTemplateCategory({
        accountSetId: props.accountSetId,
        name: formData.name,
      });
      ElMessage.success('新增成功');
      emit('select', categoryId);
    }
    resetForm();
    await getList();
  } finally {
    submitting.value = false;
  }
}

async function deleteCategory(
  row: FmsVoucherTemplateCategoryApi.VoucherTemplateCategory,
) {
  if (!props.accountSetId) return;
  try {
    await confirm('确认删除该模板分类吗？');
    await deleteVoucherTemplateCategory(props.accountSetId, row.id!);
    ElMessage.success('删除成功');
    await getList();
  } catch {
    // 取消删除
  }
}

function selectCategory(
  row: FmsVoucherTemplateCategoryApi.VoucherTemplateCategory,
) {
  if (!row.id) return;
  emit('select', row.id);
  visible.value = false;
}

defineExpose({ open });
</script>

<template>
  <ElDialog
    v-model="visible"
    destroy-on-close
    title="凭证模板分类"
    width="560px"
  >
    <ElForm
      ref="formRef"
      class="mb-4 flex w-full gap-2 [&_.el-form-item]:!mb-0 [&_.el-form-item]:flex-1"
      :model="formData"
      :rules="formRules"
    >
      <ElFormItem prop="name">
        <ElInput
          v-model="formData.name"
          :maxlength="255"
          placeholder="请输入分类名称"
        />
      </ElFormItem>
      <div class="flex">
        <ElButton
          v-if="
            formData.id &&
            fmsStore.isAccountSetWritable &&
            hasAccessByCodes(['fms:config:voucher-template-category:update'])
          "
          :loading="submitting"
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
          :loading="submitting"
          type="primary"
          @click="saveCategory"
        >
          新增
        </ElButton>
        <ElButton v-if="formData.id" @click="resetForm">取消</ElButton>
      </div>
    </ElForm>
    <ElTable
      :data="categories"
      border
      stripe
      @row-dblclick="
        (row) =>
          selectCategory(
            row as FmsVoucherTemplateCategoryApi.VoucherTemplateCategory,
          )
      "
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
            @click="
              editCategory(
                row as FmsVoucherTemplateCategoryApi.VoucherTemplateCategory,
              )
            "
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
            @click="
              deleteCategory(
                row as FmsVoucherTemplateCategoryApi.VoucherTemplateCategory,
              )
            "
          >
            删除
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>
  </ElDialog>
</template>
