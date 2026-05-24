<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { isEmpty } from '@vben/utils';

import { useClipboard, useVModel } from '@vueuse/core';
import { Button, Form, Input, message } from 'ant-design-vue';

import { IotDataSinkTypeEnum } from '#/api/iot/rule/data/sink';

const props = defineProps<{ modelValue: any }>();

const emit = defineEmits(['update:modelValue']);

const TABLE_SQL = `CREATE TABLE iot_device_message_sink (
    id VARCHAR(64) NOT NULL COMMENT '消息ID',
    device_id BIGINT NOT NULL COMMENT '设备编号',
    tenant_id BIGINT NOT NULL DEFAULT 0 COMMENT '租户编号',
    method VARCHAR(128) COMMENT '请求方法',
    report_time DATETIME COMMENT '上报时间',
    data TEXT COMMENT '完整消息JSON',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id) USING BTREE,
    INDEX idx_create_time (create_time ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'IoT 设备消息流转目标表';`;

const config = useVModel(props, 'modelValue', emit);

const showSqlTip = ref(false);
const copied = ref(false);
const { copy } = useClipboard();
let copyResetTimer: null | ReturnType<typeof setTimeout> = null;

async function handleCopySql() {
  await copy(TABLE_SQL);
  copied.value = true;
  message.success('建表 SQL 已复制到剪贴板');
  if (copyResetTimer) {
    clearTimeout(copyResetTimer);
  }
  copyResetTimer = setTimeout(() => {
    copied.value = false;
    copyResetTimer = null;
  }, 2000);
}

onBeforeUnmount(() => {
  if (copyResetTimer) {
    clearTimeout(copyResetTimer);
    copyResetTimer = null;
  }
});

onMounted(() => {
  if (!isEmpty(config.value)) {
    return;
  }
  config.value = {
    type: `${IotDataSinkTypeEnum.DATABASE}`,
    jdbcUrl: '',
    username: '',
    password: '',
    tableName: 'iot_device_message_sink',
  };
});
</script>

<template>
  <Form.Item
    :name="['config', 'jdbcUrl']"
    :rules="[
      { required: true, message: 'JDBC 连接地址不能为空', trigger: 'blur' },
    ]"
    label="JDBC 地址"
  >
    <Input
      v-model:value="config.jdbcUrl"
      placeholder="请输入 JDBC 连接地址，如：jdbc:mysql://localhost:3306/iot_data"
    />
  </Form.Item>
  <Form.Item
    :name="['config', 'username']"
    :rules="[{ required: true, message: '用户名不能为空', trigger: 'blur' }]"
    label="用户名"
  >
    <Input v-model:value="config.username" placeholder="请输入数据库用户名" />
  </Form.Item>
  <Form.Item
    :name="['config', 'password']"
    :rules="[{ required: true, message: '密码不能为空', trigger: 'blur' }]"
    label="密码"
  >
    <Input.Password
      v-model:value="config.password"
      placeholder="请输入数据库密码"
    />
  </Form.Item>
  <Form.Item
    :name="['config', 'tableName']"
    :rules="[{ required: true, message: '目标表名不能为空', trigger: 'blur' }]"
    label="目标表名"
  >
    <div class="flex items-center gap-3">
      <Input
        v-model:value="config.tableName"
        placeholder="目标表名"
        class="w-[240px]"
      />
      <Button type="link" @click="showSqlTip = !showSqlTip">
        <IconifyIcon
          :icon="showSqlTip ? 'lucide:chevron-up' : 'lucide:file-text'"
          class="mr-1"
        />
        {{ showSqlTip ? '收起表结构提示' : '查看表结构提示' }}
      </Button>
    </div>
  </Form.Item>
  <div
    v-if="showSqlTip"
    class="mt-2 overflow-hidden rounded border border-gray-200 dark:border-gray-700"
  >
    <div
      class="flex items-center justify-between bg-gray-100 px-3 py-2 dark:bg-gray-800"
    >
      <span class="text-xs text-gray-600 dark:text-gray-300">
        目标数据库需包含以下结构的表，才能正常接收数据流转的消息
      </span>
      <Button size="small" @click="handleCopySql">
        <IconifyIcon
          :icon="copied ? 'lucide:check' : 'lucide:copy'"
          class="mr-1"
        />
        {{ copied ? '已复制' : '复制 SQL' }}
      </Button>
    </div>
    <pre
      class="m-0 overflow-x-auto bg-gray-50 p-3 font-mono text-[12px] leading-normal text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    ><code>{{ TABLE_SQL }}</code></pre>
  </div>
</template>
