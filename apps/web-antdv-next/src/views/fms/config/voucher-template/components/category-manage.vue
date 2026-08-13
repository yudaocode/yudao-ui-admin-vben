<script lang="ts" setup>
import type { FormInstance, FormProps } from 'antdv-next';

import type { FmsVoucherTemplateCategoryApi } from '#/api/fms/config/voucher-template-category';

import { nextTick, reactive, ref } from 'vue';

import { useAccess } from '@vben/access';
import { confirm } from '@vben/common-ui';

import {
  Button,
  Form,
  FormItem,
  Input,
  message,
  Modal,
  Table,
} from 'antdv-next';

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
const formRules: FormProps['rules'] = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
};
const columns = [
  { title: '分类名称', dataIndex: 'name', ellipsis: true },
  { title: '操作', key: 'action', align: 'center' as const, width: 150 },
];

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
  try {
    await formRef.value.validate();
  } catch {
    return;
  }
  submitting.value = true;
  try {
    if (formData.id) {
      await updateVoucherTemplateCategory({
        id: formData.id,
        accountSetId: props.accountSetId,
        name: formData.name,
      });
      message.success('修改成功');
    } else {
      const categoryId = await createVoucherTemplateCategory({
        accountSetId: props.accountSetId,
        name: formData.name,
      });
      message.success('新增成功');
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
    message.success('删除成功');
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
  <Modal
    v-model:open="visible"
    :footer="null"
    title="凭证模板分类"
    width="560px"
  >
    <Form
      ref="formRef"
      class="mb-4 flex w-full gap-2 [&_.ant-form-item]:!mb-0 [&_.ant-form-item]:flex-1"
      :model="formData"
      :rules="formRules"
    >
      <FormItem name="name">
        <Input
          v-model:value="formData.name"
          :maxlength="255"
          placeholder="请输入分类名称"
        />
      </FormItem>
      <div class="flex">
        <Button
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
        </Button>
        <Button
          v-else-if="
            fmsStore.isAccountSetWritable &&
            hasAccessByCodes(['fms:config:voucher-template-category:create'])
          "
          :loading="submitting"
          type="primary"
          @click="saveCategory"
        >
          新增
        </Button>
        <Button v-if="formData.id" @click="resetForm">取消</Button>
      </div>
    </Form>
    <Table
      bordered
      :columns="columns"
      :custom-row="
        (record: FmsVoucherTemplateCategoryApi.VoucherTemplateCategory) => ({
          onDblclick: () => selectCategory(record),
        })
      "
      :data-source="categories"
      :pagination="false"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <Button
            v-if="
              fmsStore.isAccountSetWritable &&
              hasAccessByCodes(['fms:config:voucher-template-category:update'])
            "
            type="link"
            @click="
              editCategory(
                record as FmsVoucherTemplateCategoryApi.VoucherTemplateCategory,
              )
            "
          >
            编辑
          </Button>
          <Button
            v-if="
              fmsStore.isAccountSetWritable &&
              hasAccessByCodes(['fms:config:voucher-template-category:delete'])
            "
            danger
            type="link"
            @click="
              deleteCategory(
                record as FmsVoucherTemplateCategoryApi.VoucherTemplateCategory,
              )
            "
          >
            删除
          </Button>
        </template>
      </template>
    </Table>
  </Modal>
</template>
