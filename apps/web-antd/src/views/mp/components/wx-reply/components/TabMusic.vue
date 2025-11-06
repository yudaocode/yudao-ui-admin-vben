<script lang="ts" setup>
import type { Reply } from './types';

import type { UploadRawFile } from '#/views/mp/hooks/useUpload';

import { computed, reactive, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { useAccessStore } from '@vben/stores';

import {
  Button,
  Col,
  Input,
  message,
  Modal,
  Row,
  Upload,
} from 'ant-design-vue';

import { WxMaterialSelect } from '#/views/mp/components/wx-material-select';
import { UploadType, useBeforeUpload } from '#/views/mp/hooks/useUpload';

defineOptions({ name: 'TabMusic' });

const props = defineProps<{
  modelValue: Reply;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: Reply): void;
}>();

const accessStore = useAccessStore();
const UPLOAD_URL = `${import.meta.env.VITE_BASE_URL}/admin-api/mp/material/upload-temporary`;
const HEADERS = { Authorization: `Bearer ${accessStore.accessToken}` };

const reply = computed<Reply>({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const showDialog = ref(false);
const fileList = ref([]);
const uploadData = reactive({
  accountId: reply.value.accountId,
  introduction: '',
  title: '',
  type: 'thumb', // 音乐类型为thumb
});

function beforeImageUpload(rawFile: UploadRawFile) {
  return useBeforeUpload(UploadType.Image, 2)(rawFile);
}

// 自定义上传请求
async function customRequest(options: any) {
  const { file, onSuccess, onError } = options;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('accountId', String(uploadData.accountId));
  formData.append('type', uploadData.type);
  formData.append('title', uploadData.title);
  formData.append('introduction', uploadData.introduction);

  try {
    const response = await fetch(UPLOAD_URL, {
      method: 'POST',
      headers: HEADERS,
      body: formData,
    });

    const result = await response.json();

    if (result.code === 0) {
      // 清空上传时的各种数据
      fileList.value = [];
      uploadData.title = '';
      uploadData.introduction = '';

      // 上传好的文件，本质是个素材，所以可以进行选中
      selectMaterial(result.data);
      message.success('上传成功');
      onSuccess(result, file);
    } else {
      message.error(result.msg || '上传出错');
      onError(new Error(result.msg || '上传失败'));
    }
  } catch (error) {
    message.error('上传失败，请重试');
    onError(error);
  }
}

function selectMaterial(item: any) {
  showDialog.value = false;
  reply.value.thumbMediaId = item.mediaId;
  reply.value.thumbMediaUrl = item.url;
}
</script>

<template>
  <div>
    <Row align="middle" justify="center">
      <Col :span="6">
        <div class="thumb-container">
          <div class="thumb-preview">
            <img
              v-if="reply.thumbMediaUrl"
              :src="reply.thumbMediaUrl"
              alt="音乐封面"
              class="thumb-img"
            />
            <IconifyIcon
              v-else
              icon="mdi:plus"
              :size="40"
              class="text-gray-400"
            />
          </div>
          <div class="thumb-actions">
            <Upload
              :custom-request="customRequest"
              :multiple="true"
              :max-count="1"
              :file-list="fileList"
              :before-upload="beforeImageUpload"
              :show-upload-list="false"
            >
              <Button type="link">本地上传</Button>
            </Upload>
            <Button type="link" class="ml-2" @click="showDialog = true">
              素材库选择
            </Button>
          </div>
        </div>
        <Modal
          v-model:open="showDialog"
          title="选择图片"
          :width="1200"
          :footer="null"
          destroy-on-close
        >
          <WxMaterialSelect
            type="image"
            :account-id="reply.accountId"
            @select-material="selectMaterial"
          />
        </Modal>
      </Col>
      <Col :span="18">
        <div class="input-group">
          <Input
            :value="reply.title || undefined"
            placeholder="请输入标题"
            class="mb-5"
            @update:value="(val) => (reply.title = val || null)"
          />
          <Input
            :value="reply.description || undefined"
            placeholder="请输入描述"
            @update:value="(val) => (reply.description = val || null)"
          />
        </div>
      </Col>
    </Row>
    <div class="mt-5">
      <Input
        :value="reply.musicUrl || undefined"
        placeholder="请输入音乐链接"
        class="mb-5"
        @update:value="(val) => (reply.musicUrl = val || null)"
      />
      <Input
        :value="reply.hqMusicUrl || undefined"
        placeholder="请输入高质量音乐链接"
        @update:value="(val) => (reply.hqMusicUrl = val || null)"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.thumb-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.thumb-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-actions {
  display: flex;
  align-items: center;
  justify-content: center;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
