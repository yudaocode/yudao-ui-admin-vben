<script lang="ts" setup>
import type { FormInstance, FormProps } from 'ant-design-vue';

import type { FmsVoucherTemplateApi } from '#/api/fms/config/voucher-template';
import type { FmsVoucherTemplateCategoryApi } from '#/api/fms/config/voucher-template-category';

import { nextTick, reactive, ref } from 'vue';

import { useAccess } from '@vben/access';
import { confirm } from '@vben/common-ui';

import {
  Button,
  Checkbox,
  Form,
  FormItem,
  Input,
  message,
  Modal,
  Select,
  Table,
} from 'ant-design-vue';

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
const formRules: FormProps['rules'] = {
  categoryId: [{ required: true, message: '请选择模板分类', trigger: 'change' }],
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
};
const categoryFormRef = ref<FormInstance>(); // 模板分类表单 Ref
const categoryFormData = reactive({
  id: undefined as number | undefined,
  name: '',
});
const categoryFormRules: FormProps['rules'] = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
};

/** 模板分类表格列 */
const categoryColumns = [
  { title: '分类名称', dataIndex: 'name', ellipsis: true },
  { title: '操作', key: 'action', align: 'center' as const, width: 150 },
];

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
      message.success('修改成功');
    } else {
      formData.categoryId = await createVoucherTemplateCategory({
        accountSetId: accountSetId.value,
        name: categoryFormData.name,
      });
      message.success('新增成功');
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
    message.success('删除成功');

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
    message.success('保存成功');
    dialogVisible.value = false;
    emit('success');
  } finally {
    submitting.value = false;
  }
}

defineExpose({ open });
</script>

<template>
  <Modal
    v-model:open="dialogVisible"
    title="新增凭证模板"
    width="480px"
    destroy-on-close
  >
    <Form
      ref="formRef"
      :label-col="{ style: { width: '90px' } }"
      :model="formData"
      :rules="formRules"
    >
      <FormItem label="模板分类" name="categoryId">
        <div class="flex w-full gap-2">
          <Select
            v-model:value="formData.categoryId"
            class="flex-1"
            placeholder="请选择模板分类"
          >
            <Select.Option
              v-for="item in categories"
              :key="item.id"
              :value="item.id!"
            >
              {{ item.name }}
            </Select.Option>
          </Select>
          <Button @click="categoryDialogVisible = true">管理分类</Button>
        </div>
      </FormItem>
      <FormItem label="模板名称" name="name">
        <Input
          v-model:value="formData.name"
          :maxlength="255"
          placeholder="请输入模板名称"
        />
      </FormItem>
      <FormItem label="保存金额">
        <Checkbox v-model:checked="saveMoney">
          保留数量、单价和借贷金额
        </Checkbox>
      </FormItem>
    </Form>
    <template #footer>
      <Button type="primary" :loading="submitting" @click="submitForm">
        确 定
      </Button>
      <Button @click="dialogVisible = false">取 消</Button>
    </template>
  </Modal>

  <Modal
    v-model:open="categoryDialogVisible"
    :footer="null"
    title="凭证模板分类"
    width="560px"
  >
    <Form
      ref="categoryFormRef"
      class="mb-4 flex w-full gap-2 [&_.ant-form-item]:!mb-0 [&_.ant-form-item]:flex-1"
      :model="categoryFormData"
      :rules="categoryFormRules"
    >
      <FormItem name="name">
        <Input
          v-model:value="categoryFormData.name"
          :maxlength="255"
          placeholder="请输入分类名称"
        />
      </FormItem>
      <div class="flex">
        <Button
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
        </Button>
        <Button
          v-else-if="
            fmsStore.isAccountSetWritable &&
            hasAccessByCodes(['fms:config:voucher-template-category:create'])
          "
          :loading="categorySubmitting"
          type="primary"
          @click="saveCategory"
        >
          新增
        </Button>
        <Button v-if="categoryFormData.id" @click="resetCategoryForm">
          取消
        </Button>
      </div>
    </Form>
    <Table
      bordered
      :columns="categoryColumns"
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
            @click="editCategory(record as FmsVoucherTemplateCategoryApi.VoucherTemplateCategory)"
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
            @click="deleteCategory(record as FmsVoucherTemplateCategoryApi.VoucherTemplateCategory)"
          >
            删除
          </Button>
        </template>
      </template>
    </Table>
    <div class="mt-2.5 text-xs text-gray-400">双击分类可直接选中</div>
  </Modal>
</template>
