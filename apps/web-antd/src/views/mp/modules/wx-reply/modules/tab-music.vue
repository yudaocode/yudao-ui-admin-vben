<script lang="ts" setup>
import type { UploadFile } from 'ant-design-vue';

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
// import { getAccessToken } from '@/utils/auth'
import WxMaterialSelect from '#/views/mp/modules/wx-material-select';

// 设置上传的请求头部

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
  set: (val) => emit('update:modelValue', val),
});

const showDialog = ref(false);
const fileList = ref([]);
const uploadData = reactive({
  accountId: reply.value.accountId,
  type: 'thumb', // 音乐类型为thumb
  title: '',
  introduction: '',
});

/** 图片上传前校验 */
function beforeImageUpload(file: UploadFile) {
  return useBeforeUpload(UploadType.Image, 2)(file as any);
}

/** 上传成功 */
function onUploadSuccess(info: any) {
  const res = info.response || info;
  if (res.code !== 0) {
    message.error(`上传出错：${res.msg}`);
    return false;
  }

  // 清空上传时的各种数据
  fileList.value = [];
  uploadData.title = '';
  uploadData.introduction = '';

  // 上传好的文件，本质是个素材，所以可以进行选中
  selectMaterial(res.data);
}

/** 选择素材 */
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
        <Row align="middle" justify="center" class="inline-block text-center">
          <Col :span="24">
            <Row align="middle" justify="center">
              <img
                class="w-[100px]"
                v-if="reply.thumbMediaUrl"
                :src="reply.thumbMediaUrl"
              />
              <IconifyIcon v-else icon="ep:plus" />
            </Row>
            <Row align="middle" justify="center" class="mt-[2%]">
              <div>
                <Upload
                  :action="UPLOAD_URL"
                  :headers="HEADERS"
                  :file-list="fileList"
                  :data="uploadData"
                  :before-upload="beforeImageUpload"
                  @change="
                    (info) => {
                      if (info.file.status === 'done') {
                        onUploadSuccess(info.file.response || info.file);
                      }
                    }
                  "
                >
                  <template #default>
                    <Button type="link">本地上传</Button>
                  </template>
                </Upload>
                <Button type="link" @click="showDialog = true" class="ml-[5px]">
                  素材库选择
                </Button>
              </div>
            </Row>
          </Col>
        </Row>
        <Modal
          title="选择图片"
          v-model:open="showDialog"
          width="80%"
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
        <Input v-model:value="reply.title as string" placeholder="请输入标题" />
        <div class="my-5"></div>
        <Input
          v-model:value="reply.description as string"
          placeholder="请输入描述"
        />
      </Col>
    </Row>
    <div class="my-5"></div>
    <Input
      v-model:value="reply.musicUrl as string"
      placeholder="请输入音乐链接"
    />
    <div class="my-5"></div>
    <Input
      v-model:value="reply.hqMusicUrl as string"
      placeholder="请输入高质量音乐链接"
    />
  </div>
</template>
