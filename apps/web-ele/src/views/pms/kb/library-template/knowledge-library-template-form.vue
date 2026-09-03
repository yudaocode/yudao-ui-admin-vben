<script lang="ts" setup>
import type { FormRules } from 'element-plus';

import type { PmsKnowledgeLibraryTemplateApi } from '#/api/pms/kb/library/template';

import { computed, ref } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { CommonStatusEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';

import {
  ElButton,
  ElCol,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElRadio,
  ElRadioGroup,
  ElRow,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import {
  createKnowledgeLibraryTemplate,
  getKnowledgeLibraryTemplate,
  updateKnowledgeLibraryTemplate,
} from '#/api/pms/kb/library/template';
import { Tinymce as RichTextarea } from '#/components/tinymce';
import { ImageUpload } from '#/components/upload';

defineOptions({ name: 'PmsKnowledgeLibraryTemplateForm' });

// TODO @AI：模板基础字段用 useVbenForm schema；文档列表用 VXE Grid，不要手写 Table。内嵌文档编辑也改 useVbenModal，不要再套一层 Ant/El Modal。v-loading 换成 lock。
const emit = defineEmits<{ success: [] }>(); // 操作成功事件

const formLoading = ref(false); // 表单加载中
const formType = ref<'create' | 'update'>('create'); // 表单类型：create - 新增；update - 修改
const formData =
  ref<PmsKnowledgeLibraryTemplateApi.KnowledgeLibraryTemplateSaveReq>(
    getDefaultFormData(),
  );
const formRef = ref(); // 表单 Ref
const formRules: FormRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  status: [{ required: true, message: '请选择模板状态', trigger: 'change' }],
  sort: [{ required: true, message: '请输入显示顺序', trigger: 'blur' }],
  documents: [
    {
      validator: (_rule, _value, callback) => {
        if (formData.value.documents.length === 0) {
          callback(new Error('请至少添加一篇模板文档'));
          return;
        }
        callback();
      },
      trigger: 'change',
    },
  ],
}; // 表单校验规则
const documentDialogVisible = ref(false); // 文档编辑弹窗是否显示
const documentFormRef = ref(); // 文档表单 Ref
const documentFormData =
  ref<PmsKnowledgeLibraryTemplateApi.KnowledgeLibraryTemplateDocument>({
    title: '',
    content: '',
  });
const documentFormRules: FormRules = {
  title: [{ required: true, message: '请输入文档标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入文档内容', trigger: 'change' }],
}; // 文档表单校验规则
const editingDocumentIndex = ref(-1); // 当前编辑文档下标
const dialogTitle = computed(() =>
  formType.value === 'create' ? '新增知识库模板' : '修改知识库模板',
); // 弹窗标题

/** 新增或编辑模板文档 */
function openDocumentForm(index = -1) {
  editingDocumentIndex.value = index;
  documentFormData.value =
    index >= 0
      ? { ...formData.value.documents[index]! }
      : { title: '', content: '<p></p>' };
  documentFormRef.value?.clearValidate();
  documentDialogVisible.value = true;
}

/** 保存模板文档 */
async function submitDocumentForm() {
  if (
    !documentFormRef.value ||
    !(await documentFormRef.value.validate().catch(() => false))
  ) {
    return;
  }
  const document = { ...documentFormData.value };
  if (editingDocumentIndex.value < 0) {
    formData.value.documents.push(document);
  } else {
    formData.value.documents[editingDocumentIndex.value] = document;
  }
  documentDialogVisible.value = false;
}

/** 删除模板文档 */
async function removeDocument(index: number) {
  try {
    // 删除的二次确认
    await confirm('确定删除该模板文档吗？');
    formData.value.documents.splice(index, 1);
  } catch {
  }
}

/** 重置表单 */
function resetForm() {
  formData.value = getDefaultFormData();
  formRef.value?.resetFields();
}

/** 获得默认表单数据 */
function getDefaultFormData(): PmsKnowledgeLibraryTemplateApi.KnowledgeLibraryTemplateSaveReq {
  return {
    id: undefined,
    name: '',
    description: '',
    coverUrl: undefined,
    status: CommonStatusEnum.ENABLE,
    sort: 0,
    documents: [],
  };
}

const [Modal, modalApi] = useVbenModal({
  class: 'w-[900px]',
  onClosed() {
    documentDialogVisible.value = false;
  },
  async onConfirm() {
    // 校验表单
    if (
      !formRef.value ||
      !(await formRef.value.validate().catch(() => false))
    ) {
      return;
    }
    const documentTitles = formData.value.documents.map(
      (document) => document.title,
    );
    if (new Set(documentTitles).size !== documentTitles.length) {
      ElMessage.warning('模板文档标题不能重复');
      return;
    }
    // 提交请求
    modalApi.lock();
    try {
      if (formType.value === 'create') {
        await createKnowledgeLibraryTemplate(formData.value);
        ElMessage.success('新增成功');
      } else {
        await updateKnowledgeLibraryTemplate(formData.value);
        ElMessage.success('修改成功');
      }
      await modalApi.close();
      // 发送操作成功的事件
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData() as {
      formType: 'create' | 'update';
      id?: number;
    };
    formType.value = data.formType;
    resetForm();
    // 修改时，设置数据
    if (data.formType === 'update' && data.id) {
      formLoading.value = true;
      try {
        formData.value = await getKnowledgeLibraryTemplate(data.id);
      } finally {
        formLoading.value = false;
      }
    }
  },
});
</script>

<template>
  <Modal :title="dialogTitle">
    <ElForm
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="96px"
    >
      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="模板名称" prop="name">
            <ElInput
              v-model="formData.name"
              maxlength="100"
              placeholder="请输入模板名称"
              show-word-limit
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="模板状态" prop="status">
            <ElRadioGroup v-model="formData.status">
              <ElRadio
                v-for="dict in getDictOptions(
                  DICT_TYPE.COMMON_STATUS,
                  'number',
                )"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </ElRadio>
            </ElRadioGroup>
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="显示顺序" prop="sort">
            <ElInputNumber v-model="formData.sort" :min="0" class="!w-full" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="模板封面" prop="coverUrl">
            <ImageUpload v-model="formData.coverUrl" :limit="1" />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElFormItem label="模板简介" prop="description">
        <ElInput
          v-model="formData.description"
          :rows="3"
          maxlength="500"
          placeholder="请输入模板适用场景"
          show-word-limit
          type="textarea"
        />
      </ElFormItem>
      <ElFormItem label="模板文档" prop="documents">
        <div class="w-full">
          <ElTable :data="formData.documents" border row-key="title">
            <ElTableColumn align="center" label="#" type="index" width="60" />
            <ElTableColumn label="文档标题" min-width="300" prop="title" />
            <ElTableColumn align="center" label="操作" width="160">
              <template #default="scope">
                <ElButton
                  link
                  type="primary"
                  @click="openDocumentForm(scope.$index)"
                >
                  编辑
                </ElButton>
                <ElButton
                  link
                  type="danger"
                  @click="removeDocument(scope.$index)"
                >
                  删除
                </ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
          <ElButton
            class="mt-3"
            plain
            type="primary"
            @click="openDocumentForm()"
          >
            <IconifyIcon icon="ep:plus" />新增文档
          </ElButton>
        </div>
      </ElFormItem>
    </ElForm>

    <!-- 模板文档编辑 -->
    <ElDialog
      v-model="documentDialogVisible"
      title="编辑模板文档"
      width="900px"
      append-to-body
    >
      <ElForm
        ref="documentFormRef"
        :model="documentFormData"
        :rules="documentFormRules"
        label-width="80px"
      >
        <ElFormItem label="文档标题" prop="title">
          <ElInput
            v-model="documentFormData.title"
            maxlength="255"
            placeholder="请输入文档标题"
            show-word-limit
          />
        </ElFormItem>
        <ElFormItem label="文档内容" prop="content">
          <RichTextarea v-model="documentFormData.content" height="420px" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton type="primary" @click="submitDocumentForm">确 定</ElButton>
        <ElButton @click="documentDialogVisible = false">取 消</ElButton>
      </template>
    </ElDialog>
  </Modal>
</template>
