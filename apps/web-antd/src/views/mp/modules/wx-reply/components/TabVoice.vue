<script lang="ts" setup>
import type { UploadFile } from 'ant-design-vue';

import type { Reply } from './types';

import { computed, reactive, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { useAccessStore } from '@vben/stores';

import { Button, Col, message, Modal, Row, Upload } from 'ant-design-vue';

import { UploadType, useBeforeUpload } from '#/utils/useUpload';
import WxMaterialSelect from '#/views/mp/modules/wx-material-select';
import WxVoicePlayer from '#/views/mp/modules/wx-voice-play';

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
  set: (val: Reply) => emit('update:modelValue', val),
});

const showDialog = ref(false);
const fileList = ref([]);
const uploadData = reactive({
  accountId: reply.value.accountId,
  type: 'voice',
  title: '',
  introduction: '',
});

/** 语音上传前校验 */
function beforeVoiceUpload(file: UploadFile) {
  return useBeforeUpload(UploadType.Voice, 10)(file as any);
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

/** 删除语音 */
function onDelete() {
  reply.value.mediaId = null;
  reply.value.url = null;
  reply.value.name = null;
}

/** 选择素材 */
function selectMaterial(item: Reply) {
  showDialog.value = false;

  // reply.value.type = ReplyType.Voice
  reply.value.mediaId = item.mediaId;
  reply.value.url = item.url;
  reply.value.name = item.name;
}
</script>
<template>
  <div>
    <div class="select-item2" v-if="reply.url">
      <p class="item-name">{{ reply.name }}</p>
      <Row class="ope-row" justify="center">
        <WxVoicePlayer :url="reply.url" />
      </Row>
      <Row class="ope-row" justify="center">
        <Button type="primary" danger shape="circle" @click="onDelete">
          <IconifyIcon icon="ep:delete" />
        </Button>
      </Row>
    </div>
    <Row v-else style="text-align: center">
      <!-- 选择素材 -->
      <Col :span="12" class="col-select">
        <Button type="primary" @click="showDialog = true">
          素材库选择<IconifyIcon icon="ep:circle-check" />
        </Button>
        <Modal
          title="选择语音"
          v-model:open="showDialog"
          width="90%"
          destroy-on-close
        >
          <WxMaterialSelect
            type="voice"
            :account-id="reply.accountId"
            @select-material="selectMaterial"
          />
        </Modal>
      </Col>
      <!-- 文件上传 -->
      <Col :span="12" class="col-add">
        <Upload
          :action="UPLOAD_URL"
          :headers="HEADERS"
          :file-list="fileList"
          :data="uploadData"
          :before-upload="beforeVoiceUpload"
          @change="
            (info) => {
              if (info.file.status === 'done') {
                onUploadSuccess(info.file.response || info.file);
              }
            }
          "
        >
          <Button type="primary">点击上传</Button>
          <template #tip>
            <div class="upload-tip">
              格式支持 mp3/wma/wav/amr，文件大小不超过 2M，播放长度不超过 60s
            </div>
          </template>
        </Upload>
      </Col>
    </Row>
  </div>
</template>

<style lang="scss" scoped>
.select-item2 {
  padding: 10px;
  margin: 0 auto 10px;
  border: 1px solid #eaeaea;

  .item-name {
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 12px;
    text-align: center;
    white-space: nowrap;

    .ope-row {
      width: 100%;
      padding-top: 10px;
      text-align: center;
    }
  }

  .col-select {
    width: 49.5%;
    height: 160px;
    padding: 50px 0;
    border: 1px solid rgb(234 234 234);
  }

  .col-add {
    float: right;
    width: 49.5%;
    height: 160px;
    padding: 50px 0;
    border: 1px solid rgb(234 234 234);

    .upload-tip {
      line-height: 18px;
      text-align: center;
    }
  }
}
</style>
