<script lang="ts" setup>
import type { Reply } from './types';

import { computed, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button, Col, Modal, Row } from 'ant-design-vue';

import { WxMaterialSelect, WxNews } from '#/views/mp/components';

import { NewsType } from '../constants';

defineOptions({ name: 'TabNews' });

const props = defineProps<{
  modelValue: Reply;
  newsType: NewsType;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: Reply): void;
}>();

const reply = computed<Reply>({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const showDialog = ref(false);

function selectMaterial(item: any) {
  showDialog.value = false;
  reply.value.articles = item.content.newsItem;
}

function onDelete() {
  reply.value.articles = [];
}
</script>

<template>
  <div>
    <Row>
      <div
        v-if="reply.articles && reply.articles.length > 0"
        class="select-item"
      >
        <WxNews :articles="reply.articles" />
        <Col class="ope-row">
          <Button danger shape="circle" @click="onDelete">
            <template #icon>
              <IconifyIcon icon="mdi:delete" />
            </template>
          </Button>
        </Col>
      </div>

      <!-- 选择素材 -->
      <Col v-if="!reply.content" :span="24">
        <Row class="text-center" align="middle">
          <Col :span="24">
            <Button type="primary" @click="showDialog = true">
              {{
                newsType === NewsType.Published
                  ? '选择已发布图文'
                  : '选择草稿箱图文'
              }}
              <template #icon>
                <IconifyIcon icon="mdi:check-circle" />
              </template>
            </Button>
          </Col>
        </Row>
      </Col>

      <Modal
        v-model:open="showDialog"
        title="选择图文"
        :width="1200"
        :footer="null"
        destroy-on-close
      >
        <WxMaterialSelect
          type="news"
          :account-id="reply.accountId"
          :news-type="newsType"
          @select-material="selectMaterial"
        />
      </Modal>
    </Row>
  </div>
</template>

<style lang="scss" scoped>
/** TODO @dylan：看看有没适合 tindwind 的哈。 */
.select-item {
  width: 280px;
  padding: 10px;
  margin: 0 auto 10px;
  border: 1px solid #eaeaea;
}

.ope-row {
  padding-top: 10px;
  text-align: center;
}
</style>
