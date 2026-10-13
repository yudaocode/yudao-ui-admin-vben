<script lang="ts" setup>
import type { XqListingCredentialApi } from '#/api/xq/listing-credential';

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
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  deleteXqListingCredential,
  getXqListingCredentials,
  saveXqListingCredential,
  syncXqListingCredentialsFromXq,
} from '#/api/xq/listing-credential';

defineOptions({ name: 'XqListingCredential' });

const loading = ref(false);
const saving = ref(false);
const syncing = ref(false);
const dialogOpen = ref(false);
const rows = ref<XqListingCredentialApi.Credential[]>([]);

const form = reactive<XqListingCredentialApi.SaveReq>({
  id: undefined,
  platformCode: '',
  platformName: '',
  provider: 'mirakl',
  baseUrl: '',
  shopId: '',
  apiKey: '',
  clientId: '',
  clientSecret: '',
  supplierId: '',
  env: 'prod',
  enabled: true,
  remark: '',
});

const columns = [
  { title: '平台', key: 'platform', width: 160 },
  { title: '类型', key: 'provider', width: 90 },
  { title: 'Base / Client', key: 'identity', width: 220 },
  { title: '密钥', key: 'secret', width: 140 },
  { title: 'Shop/Supplier', key: 'shop', width: 140 },
  { title: '启用', key: 'enabled', width: 70 },
  { title: '同步时间', dataIndex: 'syncedFromXqAt', key: 'synced', width: 170 },
  { title: '操作', key: 'actions', width: 160 },
];

async function load() {
  loading.value = true;
  try {
    rows.value = (await getXqListingCredentials()) || [];
  } catch (error: any) {
    message.error(error?.message || '加载失败');
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.id = undefined;
  form.platformCode = '';
  form.platformName = '';
  form.provider = 'mirakl';
  form.baseUrl = '';
  form.shopId = '';
  form.apiKey = '';
  form.clientId = '';
  form.clientSecret = '';
  form.supplierId = '';
  form.env = 'prod';
  form.enabled = true;
  form.remark = '';
}

function openCreate() {
  resetForm();
  dialogOpen.value = true;
}

function openEdit(row: XqListingCredentialApi.Credential) {
  form.id = row.id;
  form.platformId = row.platformId;
  form.sourcePlatformId = row.sourcePlatformId;
  form.platformCode = row.platformCode;
  form.platformName = row.platformName || '';
  form.provider = row.provider === 'wayfair' ? 'wayfair' : 'mirakl';
  form.baseUrl = row.baseUrl || '';
  form.shopId = row.shopId || '';
  form.apiKey = '';
  form.clientId = row.clientId || '';
  form.clientSecret = '';
  form.supplierId = row.supplierId || '';
  form.env = row.env || 'prod';
  form.enabled = row.enabled !== false;
  form.remark = row.remark || '';
  dialogOpen.value = true;
}

async function handleSave() {
  if (!form.platformCode.trim()) {
    message.warning('请填写平台编码');
    return;
  }
  if (form.provider === 'mirakl' && !form.id && !form.apiKey?.trim()) {
    message.warning('新建 Mirakl 须填写 API Key');
    return;
  }
  if (
    form.provider === 'wayfair' &&
    !form.id &&
    (!form.clientId?.trim() || !form.clientSecret?.trim())
  ) {
    message.warning('新建 Wayfair 须填写 Client ID / Secret');
    return;
  }
  saving.value = true;
  try {
    await saveXqListingCredential({
      ...form,
      platformCode: form.platformCode.trim(),
      platformName: form.platformName?.trim() || undefined,
      baseUrl: form.baseUrl?.trim() || undefined,
      shopId: form.shopId?.trim() || undefined,
      apiKey: form.apiKey?.trim() || undefined,
      clientId: form.clientId?.trim() || undefined,
      clientSecret: form.clientSecret?.trim() || undefined,
      supplierId: form.supplierId?.trim() || undefined,
      env: form.env?.trim() || undefined,
      remark: form.remark?.trim() || undefined,
    });
    message.success('已保存');
    dialogOpen.value = false;
    await load();
  } catch (error: any) {
    message.error(error?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row: XqListingCredentialApi.Credential) {
  Modal.confirm({
    title: '删除密钥？',
    content: `确认删除「${row.platformName || row.platformCode} / ${row.provider}」？`,
    async onOk() {
      await deleteXqListingCredential(row.id);
      message.success('已删除');
      await load();
    },
  });
}

async function handleSync() {
  syncing.value = true;
  try {
    const res = await syncXqListingCredentialsFromXq();
    message.success(
      `已同步 Mirakl ${res?.mirakl || 0} / Wayfair ${res?.wayfair || 0}（跳过 ${res?.skipped || 0}）`,
    );
    await load();
  } catch (error: any) {
    message.error(error?.message || '同步失败');
  } finally {
    syncing.value = false;
  }
}

onMounted(load);
</script>

<template>
  <Page auto-content-height>
    <div class="space-y-4 p-1">
      <Alert
        type="info"
        show-icon
        message="上架平台密钥（Mirakl / Wayfair）"
        description="从原库 t_giga_listing_platform 的 mirakl_config_json / wayfair_config_json 同步到本地加密表。导表平台（如 AMZ）无需配置密钥；API 上架前请先同步或手工填写。"
      />

      <div class="rounded-lg border border-border bg-card p-4">
        <div class="mb-3 flex items-center justify-between">
          <div class="text-base font-semibold">密钥列表</div>
          <Space>
            <Button :loading="loading" @click="load">刷新</Button>
            <Button :loading="syncing" @click="handleSync">从原库同步</Button>
            <Button type="primary" @click="openCreate">新增</Button>
          </Space>
        </div>
        <Table
          :loading="loading"
          :columns="columns"
          :data-source="rows"
          row-key="id"
          size="small"
          :pagination="false"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'platform'">
              <div>{{ record.platformName || record.platformCode }}</div>
              <div class="text-xs text-muted-foreground">
                {{ record.platformCode }}
              </div>
            </template>
            <template v-else-if="column.key === 'provider'">
              <Tag :color="record.provider === 'wayfair' ? 'orange' : 'blue'">
                {{ record.provider }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'identity'">
              <span class="break-all text-xs">
                {{
                  record.provider === 'wayfair'
                    ? record.clientId || '—'
                    : record.baseUrl || '—'
                }}
              </span>
            </template>
            <template v-else-if="column.key === 'secret'">
              {{
                record.provider === 'wayfair'
                  ? record.clientSecretMask || '—'
                  : record.apiKeyMask || '—'
              }}
            </template>
            <template v-else-if="column.key === 'shop'">
              {{
                record.provider === 'wayfair'
                  ? record.supplierId || '—'
                  : record.shopId || '—'
              }}
            </template>
            <template v-else-if="column.key === 'enabled'">
              <Tag :color="record.enabled === false ? 'default' : 'success'">
                {{ record.enabled === false ? '停用' : '启用' }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'actions'">
              <Space>
                <Button type="link" size="small" @click="openEdit(record)">
                  编辑
                </Button>
                <Button
                  type="link"
                  size="small"
                  danger
                  @click="handleDelete(record)"
                >
                  删除
                </Button>
              </Space>
            </template>
          </template>
        </Table>
      </div>
    </div>

    <Modal
      v-model:open="dialogOpen"
      :title="form.id ? '编辑上架密钥' : '新增上架密钥'"
      :confirm-loading="saving"
      destroy-on-close
      @ok="handleSave"
    >
      <Form layout="vertical" class="pt-2">
        <FormItem label="类型" required>
          <Select
            v-model:value="form.provider"
            :options="[
              { label: 'Mirakl', value: 'mirakl' },
              { label: 'Wayfair', value: 'wayfair' },
            ]"
          />
        </FormItem>
        <FormItem label="平台编码" required>
          <Input v-model:value="form.platformCode" placeholder="如 kohls" />
        </FormItem>
        <FormItem label="平台名称">
          <Input v-model:value="form.platformName" />
        </FormItem>
        <template v-if="form.provider === 'mirakl'">
          <FormItem label="Base URL">
            <Input
              v-model:value="form.baseUrl"
              placeholder="https://xxx.mirakl.net"
            />
          </FormItem>
          <FormItem label="Shop ID">
            <Input v-model:value="form.shopId" />
          </FormItem>
          <FormItem :label="form.id ? 'API Key（留空不改）' : 'API Key'">
            <InputPassword
              v-model:value="form.apiKey"
              autocomplete="new-password"
            />
          </FormItem>
        </template>
        <template v-else>
          <FormItem label="Client ID">
            <Input v-model:value="form.clientId" />
          </FormItem>
          <FormItem
            :label="form.id ? 'Client Secret（留空不改）' : 'Client Secret'"
          >
            <InputPassword
              v-model:value="form.clientSecret"
              autocomplete="new-password"
            />
          </FormItem>
          <FormItem label="Supplier ID">
            <Input v-model:value="form.supplierId" />
          </FormItem>
          <FormItem label="环境">
            <Select
              v-model:value="form.env"
              :options="[
                { label: 'prod', value: 'prod' },
                { label: 'sandbox', value: 'sandbox' },
              ]"
            />
          </FormItem>
        </template>
        <FormItem label="启用">
          <Switch v-model:checked="form.enabled" />
        </FormItem>
        <FormItem label="备注">
          <Input v-model:value="form.remark" />
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>
