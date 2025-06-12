<script setup lang="ts">
import type { PropType } from 'vue';

import type { AiModelChatRoleApi } from '#/api/ai/model/chatRole';

import { ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button, Card, Dropdown, Menu } from 'ant-design-vue';

// tabs ref

// 定义属性
const props = defineProps({
  loading: {
    type: Boolean,
    required: true,
  },
  roleList: {
    type: Array as PropType<AiModelChatRoleApi.ChatRoleVO[]>,
    required: true,
  },
  showMore: {
    type: Boolean,
    required: false,
    default: false,
  },
});

// 定义钩子
const emits = defineEmits(['onDelete', 'onEdit', 'onUse', 'onPage']);
const tabsRef = ref<any>();

/** 操作：编辑、删除 */
const handleMoreClick = async (data: any) => {
  const type = data[0];
  const role = data[1];
  if (type === 'delete') {
    emits('onDelete', role);
  } else {
    emits('onEdit', role);
  }
};

/** 选中 */
const handleUseClick = (role: any) => {
  emits('onUse', role);
};

/** 滚动 */
const handleTabsScroll = async () => {
  if (tabsRef.value) {
    const { scrollTop, scrollHeight, clientHeight } = tabsRef.value;
    if (scrollTop + clientHeight >= scrollHeight - 20 && !props.loading) {
      await emits('onPage');
    }
  }
};
</script>

<template>
  <div class="card-list" ref="tabsRef" @scroll="handleTabsScroll">
    <div class="card-item" v-for="role in roleList" :key="role.id">
      <Card
        class="card"
        :body-style="{
          position: 'relative',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-start',
          width: '240px',
          maxWidth: '240px',
          padding: '15px 15px 10px',
        }"
      >
        <!-- 更多操作 -->
        <div class="more-container" v-if="showMore">
          <Dropdown>
            <Button type="text">
              <span class="icon-[ant-design--more-outlined] text-2xl"></span>
            </Button>
            <template #overlay>
              <Menu>
                <Menu.Item @click="handleMoreClick(['edit', role])">
                  <div class="flex items-center">
                    <IconifyIcon icon="ep:edit" color="#787878" />
                    <span>编辑</span>
                  </div>
                </Menu.Item>
                <Menu.Item @click="handleMoreClick(['delete', role])">
                  <div class="flex items-center">
                    <IconifyIcon icon="ep:delete" color="red" />
                    <span style="color: red">编辑</span>
                  </div>
                </Menu.Item>
              </Menu>
            </template>
          </Dropdown>
        </div>
        <!-- 角色信息 -->
        <div>
          <img class="avatar" :src="role.avatar" />
        </div>
        <div class="right-container">
          <div class="content-container">
            <div class="title">{{ role.name }}</div>
            <div class="description">{{ role.description }}</div>
          </div>
          <div class="btn-container">
            <Button type="primary" size="small" @click="handleUseClick(role)">
              使用
            </Button>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
<style scoped lang="scss">
// 卡片列表
.card-list {
  position: relative;
  display: flex;
  flex-flow: row wrap;
  place-content: flex-start start;
  align-items: start;
  height: 100%;
  padding: 0 25px;
  padding-bottom: 140px;
  overflow: auto;

  .card {
    position: relative;
    display: inline-block;
    margin-right: 20px;
    margin-bottom: 20px;
    border-radius: 10px;

    .more-container {
      position: absolute;
      top: 0;
      right: 12px;
    }

    .avatar {
      width: 40px;
      height: 40px;
      overflow: hidden;
      border-radius: 10px;
    }

    .right-container {
      width: 100%;
      margin-left: 10px;
      //height: 100px;

      .content-container {
        height: 85px;

        .title {
          max-width: 140px;
          font-size: 18px;
          font-weight: bold;
          color: #3e3e3e;
        }

        .description {
          margin-top: 10px;
          font-size: 14px;
          color: #6a6a6a;
        }
      }

      .btn-container {
        display: flex;
        flex-direction: row-reverse;
        margin-top: 2px;
      }
    }
  }
}
</style>
