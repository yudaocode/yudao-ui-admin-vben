<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsKnowledgeLibraryTemplateApi } from '#/api/pms/kb/library/template';

import { computed, markRaw, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { CommonStatusEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createKnowledgeLibraryTemplate,
  getKnowledgeLibraryTemplate,
  updateKnowledgeLibraryTemplate,
} from '#/api/pms/kb/library/template';
import { Tinymce as RichTextarea } from '#/components/tinymce';
import { ImageUpload } from '#/components/upload';

defineOptions({ name: 'PmsKnowledgeLibraryTemplateForm' });

const emit = defineEmits<{ success: [] }>();

type TemplateDocument =
  PmsKnowledgeLibraryTemplateApi.KnowledgeLibraryTemplateDocument;

const formType = ref<'create' | 'update'>('create');
const documents = ref<TemplateDocument[]>([]);
const editingDocumentIndex = ref(-1);
const dialogTitle = computed(() =>
  formType.value === 'create' ? '新增知识库模板' : '修改知识库模板',
);

const formSchema: VbenFormSchema[] = [
  {
    fieldName: 'id',
    component: 'Input',
    dependencies: { triggerFields: [''], show: () => false },
  },
  {
    fieldName: 'name',
    label: '模板名称',
    component: 'Input',
    componentProps: {
      maxlength: 100,
      placeholder: '请输入模板名称',
      showCount: true,
    },
    rules: 'required',
  },
  {
    fieldName: 'status',
    label: '模板状态',
    component: 'RadioGroup',
    componentProps: {
      options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number').map(
        (item) => ({
          label: item.label,
          value: item.value,
        }),
      ),
    },
    defaultValue: CommonStatusEnum.ENABLE,
    rules: z.number(),
  },
  {
    fieldName: 'sort',
    label: '显示顺序',
    component: 'InputNumber',
    componentProps: { class: 'w-full', min: 0 },
    defaultValue: 0,
    rules: z.number().min(0),
  },
  {
    fieldName: 'coverUrl',
    label: '模板封面',
    component: markRaw(ImageUpload),
    componentProps: { maxNumber: 1 },
  },
  {
    fieldName: 'description',
    label: '模板简介',
    component: 'Textarea',
    componentProps: {
      maxlength: 500,
      placeholder: '请输入模板适用场景',
      rows: 3,
      showCount: true,
    },
  },
];

const [Form, formApi] = useVbenForm({
  commonConfig: {
    formItemClass: 'col-span-2 md:col-span-1',
    labelWidth: 96,
  },
  layout: 'horizontal',
  schema: formSchema,
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2',
});

const documentFormSchema: VbenFormSchema[] = [
  {
    fieldName: 'title',
    label: '文档标题',
    component: 'Input',
    componentProps: {
      maxlength: 255,
      placeholder: '请输入文档标题',
      showCount: true,
    },
    rules: 'required',
  },
  {
    fieldName: 'content',
    label: '文档内容',
    component: markRaw(RichTextarea),
    componentProps: { height: '420px' },
    rules: 'required',
  },
];

const [DocumentForm, documentFormApi] = useVbenForm({
  commonConfig: {
    formItemClass: 'col-span-2',
    labelWidth: 80,
  },
  layout: 'horizontal',
  schema: documentFormSchema,
  showDefaultActions: false,
});

const [DocumentGrid, documentGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      {
        type: 'seq',
        title: '#',
        width: 60,
        align: 'center',
      },
      {
        field: 'title',
        title: '文档标题',
        minWidth: 300,
      },
      {
        title: '操作',
        width: 160,
        fixed: 'right',
        slots: { default: 'actions' },
      },
    ],
    height: 'auto',
    maxHeight: 280,
    pagerConfig: { enabled: false },
    proxyConfig: {
      ajax: {
        query: async () => ({
          list: documents.value,
          total: documents.value.length,
        }),
      },
    },
    rowConfig: { isHover: true },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<TemplateDocument>,
});

/** 打开模板文档表单 */
async function openDocumentForm(index = -1) {
  editingDocumentIndex.value = index;
  await documentFormApi.setValues(
    index >= 0
      ? { ...documents.value[index]! }
      : { title: '', content: '<p></p>' },
  );
  documentModalApi.open();
}

/** 删除模板文档 */
async function removeDocument(index: number) {
  documents.value.splice(index, 1);
  await documentGridApi.query();
}

const [DocumentModal, documentModalApi] = useVbenModal({
  class: 'w-[900px]',
  title: '编辑模板文档',
  async onConfirm() {
    const { valid } = await documentFormApi.validate();
    if (!valid) {
      return;
    }
    const document = (await documentFormApi.getValues()) as TemplateDocument;
    if (editingDocumentIndex.value < 0) {
      documents.value.push(document);
    } else {
      documents.value[editingDocumentIndex.value] = document;
    }
    await documentGridApi.query();
    await documentModalApi.close();
  },
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-[900px]',
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    if (documents.value.length === 0) {
      message.warning('请至少添加一篇模板文档');
      return;
    }
    const documentTitles = documents.value.map((document) => document.title);
    if (new Set(documentTitles).size !== documentTitles.length) {
      message.warning('模板文档标题不能重复');
      return;
    }
    const values = await formApi.getValues();
    const data = {
      ...values,
      documents: documents.value,
    } as PmsKnowledgeLibraryTemplateApi.KnowledgeLibraryTemplateSaveReq;
    modalApi.lock();
    try {
      if (formType.value === 'create') {
        await createKnowledgeLibraryTemplate(data);
        message.success('新增成功');
      } else {
        await updateKnowledgeLibraryTemplate(data);
        message.success('修改成功');
      }
      await modalApi.close();
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
    documents.value = [];
    await formApi.resetForm();
    if (data.formType === 'update' && data.id) {
      modalApi.lock();
      try {
        const template = await getKnowledgeLibraryTemplate(data.id);
        const { documents: templateDocuments, ...formValues } = template;
        documents.value = templateDocuments;
        await formApi.setValues(formValues);
      } finally {
        modalApi.unlock();
      }
    }
    await documentGridApi.query();
  },
});
</script>

<template>
  <Modal :title="dialogTitle">
    <Form class="mx-4" />
    <div class="mx-4 mt-2">
      <div class="mb-2 flex items-center justify-between">
        <span class="font-medium">模板文档</span>
        <TableAction
          :actions="[
            {
              label: '新增文档',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              onClick: () => openDocumentForm(),
            },
          ]"
        />
      </div>
      <DocumentGrid>
        <template #actions="{ row }">
          <TableAction
            :actions="[
              {
                label: '编辑',
                type: 'link',
                icon: ACTION_ICON.EDIT,
                onClick: () => openDocumentForm(documents.indexOf(row)),
              },
              {
                label: '删除',
                type: 'link',
                danger: true,
                icon: ACTION_ICON.DELETE,
                popConfirm: {
                  title: '确定删除该模板文档吗？',
                  confirm: () => removeDocument(documents.indexOf(row)),
                },
              },
            ]"
          />
        </template>
      </DocumentGrid>
    </div>

    <DocumentModal>
      <DocumentForm class="mx-4" />
    </DocumentModal>
  </Modal>
</template>
