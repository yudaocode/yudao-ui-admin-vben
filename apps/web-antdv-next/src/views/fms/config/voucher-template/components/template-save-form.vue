<script lang="ts" setup>
import type { FormInstance, FormProps } from 'antdv-next';

import type { FmsVoucherTemplateApi } from '#/api/fms/config/voucher-template';
import type { FmsVoucherTemplateCategoryApi } from '#/api/fms/config/voucher-template-category';

import { computed, reactive, ref } from 'vue';

import {
  Button,
  Checkbox,
  Form,
  FormItem,
  Input,
  message,
  Modal,
  Select,
} from 'antdv-next';

import { createVoucherTemplate } from '#/api/fms/config/voucher-template';
import { getVoucherTemplateCategorySimpleList } from '#/api/fms/config/voucher-template-category';

import CategoryManage from './category-manage.vue';

defineOptions({ name: 'FmsVoucherTemplateSaveForm' });

const emit = defineEmits<{ success: [] }>();

const dialogVisible = ref(false); // 弹窗的是否展示
const submitting = ref(false); // 表单提交的加载中
const accountSetId = ref<number>(); // 当前账套编号
const sourceEntries = ref<FmsVoucherTemplateApi.VoucherTemplateEntry[]>([]); // 来源凭证分录数组
const categories = ref<FmsVoucherTemplateCategoryApi.VoucherTemplateCategory[]>(
  [],
); // 模板分类列表
/** 模板分类下拉选项 */
const categoryOptions = computed(() =>
  categories.value.map((item) => ({ label: item.name, value: item.id! })),
);
const saveMoney = ref(false); // 是否保存数量、单价和借贷金额
const formRef = ref<FormInstance>(); // 表单 Ref
const formData = reactive({
  categoryId: undefined as number | undefined,
  name: '',
});
const formRules: FormProps['rules'] = {
  categoryId: [
    { required: true, message: '请选择模板分类', trigger: 'change' },
  ],
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
};
const categoryManageRef = ref<InstanceType<typeof CategoryManage>>();

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

/** 打开模板分类管理弹窗 */
function openCategoryDialog() {
  categoryManageRef.value?.open();
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
            :options="categoryOptions"
            placeholder="请选择模板分类"
          />
          <Button @click="openCategoryDialog">管理分类</Button>
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

  <CategoryManage
    ref="categoryManageRef"
    :account-set-id="accountSetId"
    @change="handleCategoryChange"
    @select="formData.categoryId = $event"
  />
</template>
