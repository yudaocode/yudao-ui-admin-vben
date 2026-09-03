<script lang="ts" setup>
import type { Rule } from 'ant-design-vue/es/form';

import type { PmsKnowledgeLibraryTemplateApi } from '#/api/pms/kb/library/template';

import { computed, ref } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { CommonStatusEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';

import {
  Modal as AntModal,
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Radio,
  Row,
  Table,
  Textarea,
} from 'ant-design-vue';

import {
  createKnowledgeLibraryTemplate,
  getKnowledgeLibraryTemplate,
  updateKnowledgeLibraryTemplate,
} from '#/api/pms/kb/library/template';
import { Tinymce as RichTextarea } from '#/components/tinymce';
import { ImageUpload } from '#/components/upload';

defineOptions({ name: 'PmsKnowledgeLibraryTemplateForm' });

const emit = defineEmits<{ success: [] }>(); // 操作成功事件

const formLoading = ref(false); // 表单加载中
const formType = ref<'create' | 'update'>('create'); // 表单类型：create - 新增；update - 修改
const formData =
  ref<PmsKnowledgeLibraryTemplateApi.KnowledgeLibraryTemplateSaveReq>(
    getDefaultFormData(),
  );
const formRef = ref(); // 表单 Ref
const formRules: Record<string, Rule[]> = {
  name: [{ required: true, message: '请输入模板名称' }],
  status: [{ required: true, message: '请选择模板状态' }],
  sort: [{ required: true, message: '请输入显示顺序' }],
  documents: [
    {
      validator: async () => {
        if (formData.value.documents.length === 0) {
          throw new Error('请至少添加一篇模板文档');
        }
      },
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
const documentFormRules: Record<string, Rule[]> = {
  title: [{ required: true, message: '请输入文档标题' }],
  content: [{ required: true, message: '请输入文档内容' }],
}; // 文档表单校验规则
const editingDocumentIndex = ref(-1); // 当前编辑文档下标
const dialogTitle = computed(() =>
  formType.value === 'create' ? '新增知识库模板' : '修改知识库模板',
); // 弹窗标题

const documentColumns = [
  { key: 'index', title: '#', width: 60, align: 'center' as const },
  { dataIndex: 'title', key: 'title', title: '文档标题', width: 300 },
  { key: 'action', title: '操作', width: 160, align: 'center' as const },
];

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
  } catch {}
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
      message.warning('模板文档标题不能重复');
      return;
    }
    // 提交请求
    modalApi.lock();
    try {
      if (formType.value === 'create') {
        await createKnowledgeLibraryTemplate(formData.value);
        message.success('新增成功');
      } else {
        await updateKnowledgeLibraryTemplate(formData.value);
        message.success('修改成功');
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
    <Form
      ref="formRef"
      v-loading="formLoading"
      :label-col="{ style: { width: '96px' } }"
      :model="formData"
      :rules="formRules"
    >
      <Row :gutter="20">
        <Col :span="12">
          <Form.Item label="模板名称" name="name">
            <Input
              v-model:value="formData.name"
              :maxlength="100"
              placeholder="请输入模板名称"
              show-count
            />
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item label="模板状态" name="status">
            <Radio.Group
              v-model:value="formData.status"
              :options="
                getDictOptions(DICT_TYPE.COMMON_STATUS, 'number').map(
                  (item) => ({
                    label: item.label,
                    value: item.value,
                  }),
                )
              "
            />
          </Form.Item>
        </Col>
      </Row>
      <Row :gutter="20">
        <Col :span="12">
          <Form.Item label="显示顺序" name="sort">
            <InputNumber
              v-model:value="formData.sort"
              class="!w-full"
              :min="0"
            />
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item label="模板封面" name="coverUrl">
            <ImageUpload v-model="formData.coverUrl" :max-number="1" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item label="模板简介" name="description">
        <Textarea
          v-model:value="formData.description"
          :maxlength="500"
          :rows="3"
          placeholder="请输入模板适用场景"
          show-count
        />
      </Form.Item>
      <Form.Item label="模板文档" name="documents">
        <div class="w-full">
          <Table
            :columns="documentColumns"
            :data-source="formData.documents"
            :pagination="false"
            bordered
            row-key="title"
            size="small"
          >
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'index'">{{ index + 1 }}</template>
              <template v-else-if="column.key === 'action'">
                <Button type="link" @click="openDocumentForm(index)">
                  编辑
                </Button>
                <Button danger type="link" @click="removeDocument(index)">
                  删除
                </Button>
              </template>
              <template v-else>{{ record.title }}</template>
            </template>
          </Table>
          <Button class="mt-3" @click="openDocumentForm()">
            <IconifyIcon icon="lucide:plus" />新增文档
          </Button>
        </div>
      </Form.Item>
    </Form>

    <!-- 模板文档编辑 -->
    <AntModal
      v-model:open="documentDialogVisible"
      title="编辑模板文档"
      :width="900"
      @ok="submitDocumentForm"
    >
      <Form
        ref="documentFormRef"
        :label-col="{ style: { width: '80px' } }"
        :model="documentFormData"
        :rules="documentFormRules"
      >
        <Form.Item label="文档标题" name="title">
          <Input
            v-model:value="documentFormData.title"
            :maxlength="255"
            placeholder="请输入文档标题"
            show-count
          />
        </Form.Item>
        <Form.Item label="文档内容" name="content">
          <RichTextarea v-model="documentFormData.content" height="420px" />
        </Form.Item>
      </Form>
    </AntModal>
  </Modal>
</template>
