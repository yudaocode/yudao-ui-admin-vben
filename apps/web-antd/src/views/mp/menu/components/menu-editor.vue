<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Col,
  Input,
  message,
  Modal,
  Row,
  Select,
} from 'ant-design-vue';

import { WxMaterialSelect } from '#/views/mp/modules/wx-material-select';
import { WxNews } from '#/views/mp/modules/wx-news';
import { WxReplySelect } from '#/views/mp/modules/wx-reply';

import menuOptions from './menuOptions';

const props = defineProps<{
  accountId: number;
  isParent: boolean;
  modelValue: any;
}>();

const emit = defineEmits<{
  (e: 'delete', v: void): void;
  (e: 'update:modelValue', v: any): void;
}>();

const menu = computed({
  get() {
    return props.modelValue;
  },
  set(val) {
    emit('update:modelValue', val);
  },
});
const showNewsDialog = ref(false);
const hackResetWxReplySelect = ref(false);
const isLeave = computed<boolean>(() => !(menu.value.children?.length > 0));

watch(menu, () => {
  hackResetWxReplySelect.value = false; // 销毁组件
  nextTick(() => {
    hackResetWxReplySelect.value = true; // 重建组件
  });
});

// ======================== 菜单编辑（素材选择） ========================
/** 选择素材 */
function selectMaterial(item: any) {
  const articleId = item.articleId;
  const articles = item.content.newsItem;
  // 提示，针对多图文
  if (articles.length > 1) {
    message.warning('您选择的是多图文，将默认跳转第一篇');
  }
  showNewsDialog.value = false;

  // 设置菜单的回复
  menu.value.articleId = articleId;
  menu.value.replyArticles = [];
  articles.forEach((article: any) => {
    menu.value.replyArticles.push({
      title: article.title,
      description: article.digest,
      picUrl: article.picUrl,
      url: article.url,
    });
  });
}

/** 删除素材 */
function deleteMaterial() {
  delete menu.value.articleId;
  delete menu.value.replyArticles;
}
</script>

<template>
  <div>
    <div class="configure-page">
      <div class="delete-btn">
        <Button type="primary" danger @click="emit('delete')">
          <IconifyIcon icon="lucide:trash-2" />
          删除当前菜单
        </Button>
      </div>
      <div>
        <span>菜单名称：</span>
        <Input
          class="input-width"
          v-model:value="menu.name"
          placeholder="请输入菜单名称"
          :maxlength="isParent ? 4 : 7"
          allow-clear
        />
      </div>
      <div v-if="isLeave">
        <div class="menu-content">
          <span>菜单标识：</span>
          <Input
            class="input-width"
            v-model:value="menu.menuKey"
            placeholder="请输入菜单 KEY"
            allow-clear
          />
        </div>
        <div class="menu-content">
          <span>菜单内容：</span>
          <Select
            v-model:value="menu.type"
            placeholder="请选择"
            class="input-width"
            allow-clear
          >
            <Select.Option
              v-for="item in menuOptions"
              :label="item.label"
              :value="item.value"
              :key="item.value"
            >
              {{ item.label }}
            </Select.Option>
          </Select>
        </div>
        <div class="configur-content" v-if="menu.type === 'view'">
          <span>跳转链接：</span>
          <Input
            class="input-width"
            v-model:value="menu.url"
            placeholder="请输入链接"
            allow-clear
          />
        </div>
        <div class="configur-content" v-if="menu.type === 'miniprogram'">
          <div class="applet">
            <span>小程序的 appid ：</span>
            <Input
              class="input-width"
              v-model:value="menu.miniProgramAppId"
              placeholder="请输入小程序的appid"
              allow-clear
            />
          </div>
          <div class="applet">
            <span>小程序的页面路径：</span>
            <Input
              class="input-width"
              v-model:value="menu.miniProgramPagePath"
              placeholder="请输入小程序的页面路径，如：pages/index"
              allow-clear
            />
          </div>
          <div class="applet">
            <span>小程序的备用网页：</span>
            <Input
              class="input-width"
              v-model:value="menu.url"
              placeholder="不支持小程序的老版本客户端将打开本网页"
              allow-clear
            />
          </div>
          <p class="blue">
            tips:需要和公众号进行关联才可以把小程序绑定带微信菜单上哟！
          </p>
        </div>
        <div
          class="configur-content"
          v-if="menu.type === 'article_view_limited'"
        >
          <Row>
            <div class="select-item" v-if="menu && menu.replyArticles">
              <WxNews :articles="menu.replyArticles" />
              <Row class="ope-row" justify="center" align="middle">
                <Button
                  type="primary"
                  danger
                  shape="circle"
                  @click="deleteMaterial"
                >
                  <IconifyIcon icon="lucide:trash-2" />
                </Button>
              </Row>
            </div>
            <div v-else>
              <Row justify="center">
                <Col :span="24" style="text-align: center">
                  <Button type="primary" @click="showNewsDialog = true">
                    素材库选择
                    <IconifyIcon icon="lucide:circle-check" />
                  </Button>
                </Col>
              </Row>
            </div>
            <Modal
              title="选择图文"
              v-model:open="showNewsDialog"
              width="80%"
              destroy-on-close
            >
              <WxMaterialSelect
                type="news"
                :account-id="props.accountId"
                @select-material="selectMaterial"
              />
            </Modal>
          </Row>
        </div>
        <div
          class="configur-content"
          v-if="menu.type === 'click' || menu.type === 'scancode_waitmsg'"
        >
          <WxReplySelect v-if="hackResetWxReplySelect" v-model="menu.reply" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
:deep(.ant-input) {
  // width: 70%;
  margin-right: 2%;
}

.configure-page {
  .delete-btn {
    margin-bottom: 15px;
    text-align: right;
  }

  .menu-content {
    margin-top: 20px;
  }

  .configur-content {
    padding: 20px 10px;
    margin-top: 20px;
    background-color: #fff;
    border-radius: 5px;

    .select-item {
      width: 280px;
      padding: 10px;
      margin: 0 auto 10px;
      border: 1px solid #eaeaea;

      .ope-row {
        padding-top: 10px;
        text-align: center;
      }
    }
  }

  .blue {
    margin-top: 10px;
    color: #29b6f6;
  }

  .applet {
    margin-bottom: 20px;

    span {
      width: 20%;
    }
  }

  .input-width {
    width: 240px;
  }

  .material {
    .input-width {
      width: 30%;
    }

    :deep(.ant-input) {
      width: 80%;
    }
  }
}
</style>
