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
              :action="UPLOAD_URL"
              :headers="HEADERS"
              :file-list="fileList"
              :data="uploadData"
              :before-upload="beforeVideoUpload"
              @change="
                (info) => {
                  if (info.file.status === 'done') {
                    onUploadSuccess(info.file.response || info.file);
                  }
                }
              "
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
