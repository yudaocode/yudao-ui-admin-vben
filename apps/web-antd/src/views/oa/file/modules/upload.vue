<script lang="ts" setup>
import type { UploadRequestOption } from 'ant-design-vue/lib/vc-upload/interface';

import { ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button, message, Upload } from 'ant-design-vue';

import { createFileNode } from '#/api/oa/file/node';
import { useUpload } from '#/components/upload/use-upload';
import { OA_FILE_NODE_TYPE } from '#/views/oa/utils/constants';

defineOptions({ name: 'OaFileUpload' });

const props = defineProps<{ parentId: number }>(); // 上传目标目录
const emit = defineEmits(['success']);

const uploadLoading = ref(false); // 文件上传中

/** 上传文件 */
async function handleUpload(options: UploadRequestOption) {
  // 保存上传开始时的目标目录，避免切换目录后登记到其他位置
  const parentId = props.parentId;
  uploadLoading.value = true;
  try {
    // 上传文件，获得平台文件地址
    const file = options.file as File;
    const result: any = await useUpload('oa/file').httpRequest(file);
    const url = result?.url || result?.data || result;
    // 登记云盘节点，分类由后端根据文件扩展名计算
    await createFileNode({
      parentId,
      type: OA_FILE_NODE_TYPE.FILE,
      name: file.name,
      url,
      size: file.size,
    });
    message.success('上传成功');
    emit('success');
  } finally {
    uploadLoading.value = false;
  }
}
</script>

<template>
  <!-- 上传文件并登记云盘节点 -->
  <Upload
    :custom-request="handleUpload"
    :disabled="uploadLoading"
    :show-upload-list="false"
  >
    <Button type="primary" :loading="uploadLoading">
      <IconifyIcon icon="ep:upload" /> 上传文件
    </Button>
  </Upload>
</template>
