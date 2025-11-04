<script lang="ts" setup>
import type { UploadFile } from 'ant-design-vue';
import type { UploadRequestOption } from 'ant-design-vue/lib/vc-upload/interface';

import type { Reply } from './types';

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

import { UploadType, useBeforeUpload } from '#/utils/useUpload';
import WxMaterialSelect from '#/views/mp/modules/wx-material-select';
import WxVideoPlayer from '#/views/mp/modules/wx-video-play';

const props = defineProps<{
  modelValue: Reply;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: Reply): void;
}>();

// 消息弹窗

const UPLOAD_URL = `${import.meta.env.VITE_BASE_URL}/admin-api/mp/material/upload-temporary`;
const HEADERS = { Authorization: `Bearer ${useAccessStore().accessToken}` };

const reply = computed<Reply>({
  get: () => props.modelValue,
  set: (val: Reply) => emit('update:modelValue', val),
});

const showDialog = ref(false);
const fileList = ref([]);
const uploadData = reactive({
  accountId: reply.value.accountId,
  type: 'video',
  title: '',
  introduction: '',
});

/** 视频上传前校验 */
function beforeVideoUpload(file: UploadFile) {
  return useBeforeUpload(UploadType.Video, 10)(file as any);
}

/** 自定义上传请求 */
async function customRequest(info: UploadRequestOption) {
  const formData = new FormData();
  formData.append('file', info.file as File);
  formData.append('accountId', String(uploadData.accountId));
  formData.append('type', uploadData.type);
  if (uploadData.title) {
    formData.append('title', uploadData.title);
  }
  if (uploadData.introduction) {
    formData.append('introduction', uploadData.introduction);
  }

  try {
    const xhr = new XMLHttpRequest();

    // 监听上传进度
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        info.onProgress?.({ percent });
      }
    });

    // 监听上传完成
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          onUploadSuccess(res);
          info.onSuccess?.(res);
        } catch {
          info.onError?.(new Error('解析响应失败'));
          message.error('上传失败：解析响应失败');
        }
      } else {
        info.onError?.(new Error(`上传失败：HTTP ${xhr.status}`));
        message.error('上传失败，请重试');
      }
    });

    // 监听上传错误
    xhr.addEventListener('error', () => {
      info.onError?.(new Error('上传请求失败'));
      message.error('上传失败，请重试');
    });

    // 发送请求
    xhr.open('POST', UPLOAD_URL);
    xhr.setRequestHeader('Authorization', HEADERS.Authorization);
    xhr.send(formData);
  } catch (error: any) {
    info.onError?.(error);
    message.error('上传失败，请重试');
  }
}

/** 上传成功 */
function onUploadSuccess(res: any) {
  if (res.code !== 0) {
    message.error(`上传出错：${res.msg}`);
    return false;
  }

  // 清空上传时的各种数据
  fileList.value = [];
  uploadData.title = '';
  uploadData.introduction = '';
  selectMaterial(res.data);
}

/** 选择素材后设置 */
function selectMaterial(item: any) {
  showDialog.value = false;

  reply.value.mediaId = item.mediaId;
  reply.value.url = item.url;
  reply.value.name = item.name;

  // title、introduction：从 item 到 tempObjItem，因为素材里有 title、introduction
  if (item.title) {
    reply.value.title = item.title || '';
  }
  if (item.introduction) {
    reply.value.description = item.introduction || '';
  }
}
</script>

<template>
  <div>
    <Row>
      <Input
        v-model:value="reply.title as string"
        class="input-margin-bottom"
        placeholder="请输入标题"
      />
      <Input
        class="input-margin-bottom"
        v-model:value="reply.description as string"
        placeholder="请输入描述"
      />
      <Row class="ope-row" justify="center">
        <WxVideoPlayer v-if="reply.url" :url="reply.url" />
      </Row>
      <Col class="w-full">
        <Row style="text-align: center" align="middle">
          <!-- 选择素材 -->
          <Col :span="12">
            <Button type="primary" @click="showDialog = true">
              素材库选择 <IconifyIcon icon="ep:circle-check" />
            </Button>
            <Modal
              title="选择视频"
              v-model:open="showDialog"
              width="90%"
              destroy-on-close
            >
              <WxMaterialSelect
                type="video"
                :account-id="reply.accountId"
                @select-material="selectMaterial"
              />
            </Modal>
          </Col>
          <!-- 文件上传 -->
          <Col :span="12">
            <Upload
              :file-list="fileList"
              :before-upload="beforeVideoUpload"
              :custom-request="customRequest"
            >
              <Button type="primary">
                新建视频 <IconifyIcon icon="ep:upload" />
              </Button>
            </Upload>
          </Col>
        </Row>
      </Col>
    </Row>
  </div>
</template>

<style lang="scss" scoped>
.input-margin-bottom {
  margin-bottom: 2%;
}

.ope-row {
  width: 100%;
  padding-top: 10px;
  text-align: center;
}
</style>
