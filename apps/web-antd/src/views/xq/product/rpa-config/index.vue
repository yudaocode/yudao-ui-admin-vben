<script lang="ts" setup>
import type { XqRpaConfigApi } from '#/api/xq/rpa-config';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Form,
  FormItem,
  Input,
  InputPassword,
  message,
  Space,
  Tag,
} from 'ant-design-vue';

import { getXqRpaConfig, saveXqRpaConfig } from '#/api/xq/rpa-config';

defineOptions({ name: 'XqRpaConfig' });

const loading = ref(false);
const saving = ref(false);
const globalConfigured = ref(false);
const globalBaseUrl = ref('');
const globalAppKeyMasked = ref('');
const hasPassword = ref(false);

const form = reactive({
  imageJobUuid: '',
  copyJobUuid: '',
  password: '',
  runnerMode: 'commander' as XqRpaConfigApi.RunnerMode,
});

async function load() {
  loading.value = true;
  try {
    const data = await getXqRpaConfig();
    globalConfigured.value = !!data?.globalConfigured;
    globalBaseUrl.value = data?.globalBaseUrl || '';
    globalAppKeyMasked.value = data?.globalAppKeyMasked || '';
    hasPassword.value = !!data?.hasPassword;
    form.imageJobUuid = data?.imageJobUuid || '';
    form.copyJobUuid = data?.copyJobUuid || '';
    form.password = '';
    form.runnerMode =
      (data?.runnerMode as XqRpaConfigApi.RunnerMode) || 'commander';
  } catch (error: any) {
    message.error(error?.message || '加载配置失败');
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  if (!form.copyJobUuid.trim() && !form.imageJobUuid.trim()) {
    message.warning('请至少填写文案或生图流程 UUID');
    return;
  }
  if (!hasPassword.value && !form.password.trim()) {
    message.warning('请填写密码');
    return;
  }
  saving.value = true;
  try {
    await saveXqRpaConfig({
      imageJobUuid: form.imageJobUuid.trim() || undefined,
      copyJobUuid: form.copyJobUuid.trim() || undefined,
      password: form.password.trim() || undefined,
      runnerMode: form.runnerMode || 'commander',
    });
    message.success('已保存');
    await load();
  } catch (error: any) {
    message.error(error?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <Page auto-content-height>
    <div class="mx-auto max-w-3xl space-y-4 p-1">
      <Alert
        type="info"
        show-icon
        message="个人 RPA 配置"
        description="只需填写流程 UUID 和密码。点「执行文案」会自动触发影刀；账号取当前登录用户，站点取系统回调地址，无需再手填或手动触发。"
      />

      <div class="rounded-lg border border-border bg-card p-4">
        <div class="mb-3 flex items-center justify-between">
          <div class="text-base font-semibold">全局密钥状态</div>
          <Space>
            <Tag v-if="globalConfigured" color="success">管理员已配置</Tag>
            <Tag v-else color="error">管理员未配置</Tag>
            <Button :loading="loading" @click="load">刷新</Button>
          </Space>
        </div>
        <div class="space-y-1 text-sm text-muted-foreground">
          <div>API：{{ globalBaseUrl || '-' }}</div>
          <div>appKey：{{ globalAppKeyMasked || '-' }}</div>
        </div>
      </div>

      <div class="rounded-lg border border-border bg-card p-4">
        <div class="mb-4 text-base font-semibold">流程 ID 与密码</div>
        <Form layout="vertical" :model="form">
          <FormItem label="文案生成流程 UUID" required>
            <Input
              v-model:value="form.copyJobUuid"
              placeholder="发布「文案生成流程」后的 Job UUID"
            />
          </FormItem>
          <FormItem label="生图 / 拉取任务 UUID（可选）">
            <Input
              v-model:value="form.imageJobUuid"
              placeholder="生图流程 Job UUID，暂不跑生图可留空"
            />
          </FormItem>
          <FormItem
            :label="hasPassword ? '密码（已保存，留空不改）' : '密码'"
            :required="!hasPassword"
          >
            <InputPassword
              v-model:value="form.password"
              placeholder="写入 RPA 入参「密码」"
            />
          </FormItem>
          <Button type="primary" :loading="saving" @click="handleSave">
            保存
          </Button>
        </Form>
      </div>
    </div>
  </Page>
</template>
