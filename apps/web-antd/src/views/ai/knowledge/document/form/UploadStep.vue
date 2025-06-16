<script setup lang="ts">
import type { UploadProps } from 'ant-design-vue';
import type { UploadRequestOption } from 'ant-design-vue/lib/vc-upload/interface';

import type { PropType } from 'vue';

import type { AxiosProgressEvent } from '#/api/infra/file';

import { computed, getCurrentInstance, inject, onMounted, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { Button, Form, message, UploadDragger } from 'ant-design-vue';

import { useUpload } from '#/components/upload/use-upload';
import { generateAcceptedFileTypes } from '#/utils/upload';

const props = defineProps({
  modelValue: {
    type: Object as PropType<any>,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);
const formRef = ref(); // 表单引用
const uploadRef = ref(); // 上传组件引用
const parent = inject('parent', null); // 获取父组件实例
const { uploadUrl, httpRequest } = useUpload(); // 使用上传组件的钩子
const fileList = ref<UploadProps['fileList']>([]); // 文件列表
const uploadingCount = ref(0); // 上传中的文件数量

// 支持的文件类型和大小限制
const supportedFileTypes = [
  'TXT',
  'MARKDOWN',
  'MDX',
  'PDF',
  'HTML',
  'XLSX',
  'XLS',
  'DOC',
  'DOCX',
  'CSV',
  'EML',
  'MSG',
  'PPTX',
  'XML',
  'EPUB',
  'PPT',
  'MD',
  'HTM',
];
const allowedExtensions = new Set(
  supportedFileTypes.map((ext) => ext.toLowerCase()),
); // 小写的扩展名列表
const maxFileSize = 15; // 最大文件大小(MB)

// 构建 accept 属性值，用于限制文件选择对话框中可见的文件类型
const acceptedFileTypes = computed(() =>
  generateAcceptedFileTypes(supportedFileTypes),
);

/** 表单数据 */
const modelData = computed({
  get: () => {
    return props.modelValue;
  },
  set: (val) => emit('update:modelValue', val),
});
/** 确保 list 属性存在 */
const ensureListExists = () => {
  if (!props.modelValue.list) {
    emit('update:modelValue', {
      ...props.modelValue,
      list: [],
    });
  }
};
/** 是否所有文件都已上传完成 */
const isAllUploaded = computed(() => {
  return (
    modelData.value.list &&
    modelData.value.list.length > 0 &&
    uploadingCount.value === 0
  );
});

/**
 * 上传前检查文件类型和大小
 *
 * @param file 待上传的文件
 * @returns 是否允许上传
 */
const beforeUpload = (file: any) => {
  // 1.1 检查文件扩展名
  const fileName = file.name.toLowerCase();
  const fileExtension = fileName.slice(
    Math.max(0, fileName.lastIndexOf('.') + 1),
  );
  if (!allowedExtensions.has(fileExtension)) {
    message.error('不支持的文件类型！');
    return false;
  }
  // 1.2 检查文件大小
  if (!(file.size / 1024 / 1024 < maxFileSize)) {
    message.error(`文件大小不能超过 ${maxFileSize} MB！`);
    return false;
  }

  // 2. 增加上传中的文件计数
  uploadingCount.value++;
  return true;
};
async function customRequest(info: UploadRequestOption<any>) {
  const file = info.file as File;
  const name = file?.name;
  try {
    // 上传文件
    const progressEvent: AxiosProgressEvent = (e) => {
      const percent = Math.trunc((e.loaded / e.total!) * 100);
      info.onProgress!({ percent });
    };
    const res = await httpRequest(info.file as File, progressEvent);
    info.onSuccess!(res);
    message.success($t('ui.upload.uploadSuccess'));
    ensureListExists();
    emit('update:modelValue', {
      ...props.modelValue,
      list: [
        ...props.modelValue.list,
        {
          name,
          url: res,
        },
      ],
    });
  } catch (error: any) {
    console.error(error);
    info.onError!(error);
  } finally {
    uploadingCount.value = Math.max(0, uploadingCount.value - 1);
  }
}
/**
 * 从列表中移除文件
 *
 * @param index 要移除的文件索引
 */
const removeFile = (index: number) => {
  // 从列表中移除文件
  const newList = [...props.modelValue.list];
  newList.splice(index, 1);
  // 更新表单数据
  emit('update:modelValue', {
    ...props.modelValue,
    list: newList,
  });
};

/** 下一步按钮处理 */
const handleNextStep = () => {
  // 1.1 检查是否有文件上传
  if (!modelData.value.list || modelData.value.list.length === 0) {
    message.warning('请上传至少一个文件');
    return;
  }
  // 1.2 检查是否有文件正在上传
  if (uploadingCount.value > 0) {
    message.warning('请等待所有文件上传完成');
    return;
  }

  // 2. 获取父组件的goToNextStep方法
  const parentEl = parent || getCurrentInstance()?.parent;
  if (parentEl && typeof parentEl.exposed?.goToNextStep === 'function') {
    parentEl.exposed.goToNextStep();
  }
};

/** 初始化 */
onMounted(() => {
  ensureListExists();
});
</script>

<template>
  <Form ref="formRef" :model="modelData" label-width="0" class="mt-[20px]">
    <Form.Item class="mb-[20px]">
      <div class="w-full">
        <div
          class="w-full rounded-md border-2 border-dashed border-[#dcdfe6] p-[20px] text-center hover:border-[#409eff]"
        >
          <UploadDragger
            ref="uploadRef"
            class="upload-demo"
            :action="uploadUrl"
            v-model:file-list="fileList"
            :accept="acceptedFileTypes"
            :show-upload-list="false"
            :before-upload="beforeUpload"
            :custom-request="customRequest"
            :multiple="true"
          >
            <div class="flex flex-col items-center justify-center py-[20px]">
              <IconifyIcon
                icon="ep:upload-filled"
                class="mb-[10px] text-[48px] text-[#c0c4cc]"
              />
              <div class="ant-upload-text text-[16px] text-[#606266]">
                拖拽文件至此，或者
                <em class="cursor-pointer not-italic text-[#409eff]"
                  >选择文件</em
                >
              </div>
              <div class="ant-upload-tip mt-10px text-[12px] text-[#909399]">
                已支持 {{ supportedFileTypes.join('、') }}，每个文件不超过
                {{ maxFileSize }} MB。
              </div>
            </div>
          </UploadDragger>
        </div>
        <div
          v-if="modelData.list && modelData.list.length > 0"
          class="mt-[15px] grid grid-cols-1 gap-2"
        >
          <div
            v-for="(file, index) in modelData.list"
            :key="index"
            class="flex items-center justify-between rounded-sm border-l-4 border-l-[#409eff] px-[12px] py-[4px] shadow-sm transition-all duration-300 hover:bg-[#ecf5ff]"
          >
            <div class="flex items-center">
              <IconifyIcon icon="ep:document" class="mr-[8px] text-[#409eff]" />
              <span class="break-all text-[13px] text-[#303133]">{{
                file.name
              }}</span>
            </div>
            <Button
              danger
              type="text"
              link
              @click="removeFile(index)"
              class="ml-2"
            >
              <IconifyIcon icon="ep:delete" />
            </Button>
          </div>
        </div>
      </div>
    </Form.Item>
    <Form.Item>
      <div class="flex w-full justify-end">
        <Button
          type="primary"
          @click="handleNextStep"
          :disabled="!isAllUploaded"
        >
          下一步
        </Button>
      </div>
    </Form.Item>
  </Form>
</template>
