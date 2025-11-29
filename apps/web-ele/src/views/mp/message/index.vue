<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { DICT_TYPE, MpMsgType } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';

import {
  ElButton,
  ElDatePicker,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElPagination,
  ElSelect,
} from 'element-plus';

import { getMessagePage } from '#/api/mp/message';
import { WxAccountSelect, WxMsg } from '#/views/mp/components';

import MessageTable from './message-table.vue';

defineOptions({ name: 'MpMessage' });

const loading = ref(false);
const total = ref(0); // 数据的总页数
const list = ref<any[]>([]); // 当前页的列表数据

const queryParams = reactive<{
  accountId: number;
  createTime: [Dayjs, Dayjs] | undefined;
  openid: string;
  pageNo: number;
  pageSize: number;
  type: string;
}>({
  accountId: -1,
  createTime: undefined,
  openid: '',
  pageNo: 1,
  pageSize: 10,
  type: MpMsgType.Text,
}); // 搜索参数

const queryFormRef = ref(); // 搜索的表单

// 消息对话框
const messageBoxVisible = ref(false);
const messageBoxUserId = ref(0);

/** 侦听 accountId */
function onAccountChanged(id: number) {
  queryParams.accountId = id;
  queryParams.pageNo = 1;
  handleQuery();
}

/** 查询列表 */
function handleQuery() {
  queryParams.pageNo = 1;
  getList();
}

async function getList() {
  try {
    loading.value = true;
    const data = await getMessagePage(queryParams);
    list.value = data.list;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

/** 重置按钮操作 */
async function resetQuery() {
  // 暂存 accountId，并在 reset 后恢复
  const accountId = queryParams.accountId;
  queryFormRef.value?.resetFields();
  queryParams.accountId = accountId;
  handleQuery();
}

/** 打开消息发送窗口 */
async function handleSend(userId: number) {
  messageBoxUserId.value = userId;
  messageBoxVisible.value = true;
}

/** 分页改变事件 */
function handlePageChange(page: number) {
  queryParams.pageNo = page;
  getList();
}

/** 每页条数改变事件 */
function handleSizeChange(pageSize: number) {
  queryParams.pageSize = pageSize;
  queryParams.pageNo = 1;
  getList();
}

/** 显示总条数 */
function showTotal(total: number) {
  return `共 ${total} 条`;
}
</script>

<template>
  <Page auto-content-height class="flex flex-col">
    <!-- 搜索工作栏 -->
    <div class="bg-background mb-4 rounded-lg p-4">
      <ElForm
        ref="queryFormRef"
        :model="queryParams"
        :inline="true"
        class="search-form"
      >
        <ElFormItem label="公众号" prop="accountId">
          <WxAccountSelect @change="onAccountChanged" />
        </ElFormItem>
        <ElFormItem label="消息类型" prop="type">
          <ElSelect
            v-model="queryParams.type"
            placeholder="请选择消息类型"
            class="!w-[240px]"
          >
            <ElOption
              v-for="dict in getDictOptions(DICT_TYPE.MP_MESSAGE_TYPE)"
              :key="dict.value"
              :value="dict.value"
              :label="dict.label"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="用户标识" prop="openid">
          <ElInput
            v-model="queryParams.openid"
            placeholder="请输入用户标识"
            clearable
            class="!w-[240px]"
          />
        </ElFormItem>
        <ElFormItem label="创建时间" prop="createTime">
          <ElDatePicker
            v-model="queryParams.createTime"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            class="!w-[240px]"
          />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="handleQuery">
            <template #icon>
              <IconifyIcon icon="mdi:magnify" />
            </template>
            搜索
          </ElButton>
          <ElButton class="ml-2" @click="resetQuery">
            <template #icon>
              <IconifyIcon icon="mdi:refresh" />
            </template>
            重置
          </ElButton>
        </ElFormItem>
      </ElForm>
    </div>

    <!-- 列表 -->
    <div class="bg-background flex-1 rounded-lg p-4">
      <MessageTable :list="list" :loading="loading" @send="handleSend" />
      <div v-show="total > 0" class="mt-4 flex justify-end">
        <ElPagination
          v-model:current-page="queryParams.pageNo"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :show-total="showTotal"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <!-- 发送消息的弹窗 -->
    <ElDialog
      v-model="messageBoxVisible"
      title="粉丝消息列表"
      width="800"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <WxMsg :user-id="messageBoxUserId" />
    </ElDialog>
  </Page>
</template>

<style scoped>
.search-form :deep(.el-form-item) {
  margin-bottom: 16px;
}
</style>

