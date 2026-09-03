<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  getKnowledgeDocument,
  updateKnowledgeDocument,
} from '#/api/pms/kb/content/document';
import { Tinymce as RichTextarea } from '#/components/tinymce';
import { FileUpload } from '#/components/upload';
import {
  PmsKnowledgeDocumentType,
  PmsKnowledgeUploadFileSize,
} from '#/views/pms/kb/utils/constants';

import { useUpdateFormSchema } from './data';

defineOptions({ name: 'PmsKnowledgeDocumentUpdateForm' });

const emit = defineEmits(['success']); // 定义 success 事件，用于操作成功后的回调

const previewing = ref(false); // 富文本只读预览
const documentType = ref<number>(PmsKnowledgeDocumentType.RICH_TEXT); // 文档类型，决定内容编辑方式

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'vertical',
  schema: useUpdateFormSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1',
});

/** 提交表单 */
async function submitForm() {
  const { valid } = await formApi.validate();
  if (!valid) {
    return;
  }
  // 提交请求
  modalApi.lock();
  try {
    const values = await formApi.getValues();
    await updateKnowledgeDocument({
      id: values.id,
      title: values.title,
      content: values.content,
      labelIds: values.labelIds,
      fileType: values.fileType,
      fileSize: values.fileSize,
    });
    message.success('更新成功');
    await modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}

/** 文件重新上传后更新文件大小元数据 */
function handleFileSizeChange(value?: number) {
  formApi.setFieldValue('fileSize', value);
}

/** 文件替换后更新文档内容，并同步扩展名元数据 */
function handleFileChange(
  updateContent: (value: string) => void,
  value: string,
) {
  updateContent(value);
  if (!value) {
    return;
  }
  const fileName = decodeURIComponent(
    value.split('?')[0]!.split('/').pop() || '',
  );
  formApi.setFieldValue(
    'fileType',
    fileName.includes('.')
      ? fileName.split('.').pop()?.toLowerCase()
      : undefined,
  );
}

const [Modal, modalApi] = useVbenModal({
  class: 'w-full',
  fullscreen: true,
  onConfirm: submitForm,
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData() as { id: number };
    previewing.value = false;
    modalApi.lock();
    try {
      // 1. 查询文档详情
      const document = await getKnowledgeDocument(data.id);
      documentType.value = document.type;
      // 2. 初始化文档表单
      await formApi.setValues({
        id: document.id,
        title: document.title,
        content: document.content || document.previewUrl || '',
        type: document.type,
        labelIds: document.labelIds ?? [],
        fileType: document.fileType,
        fileSize: document.fileSize,
      });
    } finally {
      modalApi.unlock();
    }
  },
});

/** 打开弹窗 */
defineExpose({
  open: (id: number) => {
    modalApi.setData({ id }).open();
  },
});
</script>

<template>
  <Modal title="编辑文档">
    <template #footer>
      <div class="flex items-center gap-3">
        <Button type="primary" @click="submitForm">保存</Button>
        <Button class="!ml-0" @click="previewing = !previewing">
          {{ previewing ? '返回编辑' : '预览' }}
        </Button>
        <Button class="!ml-0" @click="modalApi.close()">取消</Button>
      </div>
    </template>
    <Form class="w-full p-4">
      <template #content="slotProps">
        <template v-if="documentType === PmsKnowledgeDocumentType.RICH_TEXT">
          <div
            v-if="previewing"
            class="pms-knowledge-rich-text"
            v-dompurify-html="
              slotProps.componentField.modelValue || '<p>暂无内容</p>'
            "
          ></div>
          <div v-else class="w-full min-w-0">
            <RichTextarea
              :model-value="slotProps.componentField.modelValue"
              class="w-full"
              height="calc(100vh - 120px)"
              @update:model-value="
                slotProps.componentField['onUpdate:modelValue']
              "
            />
          </div>
        </template>
        <FileUpload
          v-else
          :model-value="slotProps.componentField.modelValue"
          :accept="['doc', 'xls', 'ppt', 'txt', 'pdf']"
          :max-number="1"
          :max-size="PmsKnowledgeUploadFileSize"
          @update:file-size="handleFileSizeChange"
          @update:model-value="
            handleFileChange(
              slotProps.componentField['onUpdate:modelValue'],
              $event,
            )
          "
        />
      </template>
    </Form>
  </Modal>
</template>
