<script lang="ts" setup>
import type { SystemUserApi } from '#/api/system/user';
import type { XqStorePlatformApi } from '#/api/xq/store-platform';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Checkbox,
  Empty,
  Form,
  FormItem,
  Input,
  InputNumber,
  InputPassword,
  message,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  TabPane,
  Tabs,
  Tag,
  Textarea,
} from 'ant-design-vue';

import { getSimpleUserList } from '#/api/system/user';
import {
  bindXqUserStores,
  deleteXqPlatform,
  deleteXqPlatformAlias,
  deleteXqStore,
  getXqPlatformAliases,
  getXqPlatforms,
  getXqStores,
  getXqUserStores,
  saveXqPlatform,
  saveXqPlatformAlias,
  saveXqStore,
  syncXqStorePlatformLegacy,
} from '#/api/xq/store-platform';

defineOptions({ name: 'XqStorePlatform' });

const loading = ref(false);
const syncing = ref(false);
const saving = ref(false);
const activeTab = ref('platform');

const platforms = ref<XqStorePlatformApi.Platform[]>([]);
const stores = ref<XqStorePlatformApi.Store[]>([]);
const allStores = ref<XqStorePlatformApi.Store[]>([]);
const aliases = ref<XqStorePlatformApi.Alias[]>([]);
const users = ref<SystemUserApi.User[]>([]);

const storeFilterPlatformId = ref<number | undefined>();

const platformDialogOpen = ref(false);
const storeDialogOpen = ref(false);
const aliasDialogOpen = ref(false);

const platformForm = reactive<XqStorePlatformApi.PlatformSaveReq>({
  id: undefined,
  code: '',
  name: '',
  sourcePlatformId: '',
  sort: 0,
  enabled: true,
  remark: '',
});

const storeForm = reactive<XqStorePlatformApi.StoreSaveReq>({
  id: undefined,
  name: '',
  platformId: 0,
  sourceStoreId: undefined,
  account: '',
  password: '',
  imageUrl: '',
  status: 1,
  deptId: '',
  remark: '',
});

const aliasForm = reactive<XqStorePlatformApi.AliasSaveReq>({
  id: undefined,
  platformId: 0,
  alias: '',
});

const bindUserId = ref<number | undefined>();
const bindStoreIds = ref<number[]>([]);
const bindRestricted = ref(false);
const bindLoading = ref(false);
const bindSaving = ref(false);
const bindKeyword = ref('');

const platformOptions = computed(() =>
  platforms.value.map((p) => ({
    value: p.id,
    label: `${p.name} (${p.code})`,
  })),
);

const userOptions = computed(() =>
  users.value.map((u) => {
    const name = u.nickname || u.username || String(u.id);
    // simple-list 常常只有昵称，没有 username，别再拼空括号
    return {
      value: u.id!,
      label:
        u.username && u.username !== name ? `${name}（${u.username}）` : name,
    };
  }),
);

const bindableStores = computed(() => {
  const kw = bindKeyword.value.trim().toLowerCase();
  if (!kw) return allStores.value;
  return allStores.value.filter((s) => {
    const hay = [
      s.name,
      s.platformName,
      s.platformCode,
      String(s.sourceStoreId ?? ''),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(kw);
  });
});

const storesByPlatform = computed(() => {
  const map = new Map<string, XqStorePlatformApi.Store[]>();
  for (const s of bindableStores.value) {
    const key = s.platformName || s.platformCode || '未分组';
    const list = map.get(key) || [];
    list.push(s);
    map.set(key, list);
  }
  return [...map.entries()].map(([platform, list]) => ({ platform, list }));
});

const bindSelectedCount = computed(() => bindStoreIds.value.length);

const platformColumns = [
  { title: '编码', dataIndex: 'code', key: 'code', width: 110 },
  { title: '名称', dataIndex: 'name', key: 'name', width: 140 },
  { title: '店铺数', dataIndex: 'storeCount', key: 'storeCount', width: 80 },
  { title: '排序', dataIndex: 'sort', key: 'sort', width: 70 },
  { title: '启用', key: 'enabled', width: 80 },
  { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
  { title: '操作', key: 'actions', width: 140 },
];

const storeColumns = [
  { title: '店铺', dataIndex: 'name', key: 'name', width: 140 },
  { title: '平台', key: 'platform', width: 130 },
  {
    title: '原库店铺ID',
    dataIndex: 'sourceStoreId',
    key: 'sourceStoreId',
    width: 100,
  },
  { title: '账号', dataIndex: 'account', key: 'account', width: 140 },
  { title: '密码', key: 'password', width: 120 },
  { title: '状态', key: 'status', width: 80 },
  { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
  { title: '操作', key: 'actions', width: 140 },
];

const aliasColumns = [
  { title: '别名', dataIndex: 'alias', key: 'alias', width: 140 },
  {
    title: '平台编码',
    dataIndex: 'platformCode',
    key: 'platformCode',
    width: 120,
  },
  {
    title: '平台名称',
    dataIndex: 'platformName',
    key: 'platformName',
    width: 140,
  },
  { title: '操作', key: 'actions', width: 140 },
];

async function loadPlatforms() {
  platforms.value = (await getXqPlatforms()) || [];
}

async function loadStores(reloadAll = true) {
  stores.value = (await getXqStores(storeFilterPlatformId.value)) || [];
  if (reloadAll) {
    allStores.value =
      storeFilterPlatformId.value === undefined
        ? [...stores.value]
        : (await getXqStores()) || [];
  }
}

async function loadAliases() {
  aliases.value = (await getXqPlatformAliases()) || [];
}

async function loadUsers() {
  users.value = (await getSimpleUserList()) || [];
}

async function loadAll() {
  loading.value = true;
  try {
    await Promise.all([
      loadPlatforms(),
      loadStores(),
      loadAliases(),
      loadUsers(),
    ]);
  } catch (error: any) {
    message.error(error?.message || '加载失败');
  } finally {
    loading.value = false;
  }
}

async function handleSync() {
  syncing.value = true;
  try {
    const res = await syncXqStorePlatformLegacy();
    const failed = res?.unmatchedAccounts?.length
      ? `；失败 ${res.unmatchedAccounts.length}`
      : '';
    message.success(
      `同步完成：平台 ${res?.platformUpserted ?? 0}，店铺 ${res?.storeUpserted ?? 0}，用户 ${res?.userCreated ?? 0}/${res?.userMatched ?? 0}，绑店 ${res?.userStoreBound ?? 0}${failed}`,
    );
    await loadAll();
  } catch (error: any) {
    message.error(error?.message || '同步失败');
  } finally {
    syncing.value = false;
  }
}

function resetPlatformForm() {
  platformForm.id = undefined;
  platformForm.code = '';
  platformForm.name = '';
  platformForm.sourcePlatformId = '';
  platformForm.sort = 0;
  platformForm.enabled = true;
  platformForm.remark = '';
}

function openCreatePlatform() {
  resetPlatformForm();
  platformDialogOpen.value = true;
}

function openEditPlatform(row: XqStorePlatformApi.Platform) {
  platformForm.id = row.id;
  platformForm.code = row.code;
  platformForm.name = row.name;
  platformForm.sourcePlatformId = row.sourcePlatformId || '';
  platformForm.sort = row.sort ?? 0;
  platformForm.enabled = row.enabled !== false;
  platformForm.remark = row.remark || '';
  platformDialogOpen.value = true;
}

async function handleSavePlatform() {
  if (!platformForm.code.trim() || !platformForm.name.trim()) {
    message.warning('请填写平台编码与名称');
    return;
  }
  saving.value = true;
  try {
    await saveXqPlatform({
      ...platformForm,
      code: platformForm.code.trim(),
      name: platformForm.name.trim(),
      sourcePlatformId: platformForm.sourcePlatformId?.trim() || undefined,
      remark: platformForm.remark?.trim() || undefined,
    });
    message.success('平台已保存');
    platformDialogOpen.value = false;
    await loadPlatforms();
  } catch (error: any) {
    message.error(error?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

function handleDeletePlatform(row: XqStorePlatformApi.Platform) {
  Modal.confirm({
    title: '删除平台？',
    content: `确认删除「${row.name}」？其下不能有店铺。`,
    async onOk() {
      await deleteXqPlatform(row.id);
      message.success('已删除');
      await Promise.all([loadPlatforms(), loadAliases()]);
    },
  });
}

function resetStoreForm() {
  storeForm.id = undefined;
  storeForm.name = '';
  storeForm.platformId = platforms.value[0]?.id || 0;
  storeForm.sourceStoreId = undefined;
  storeForm.account = '';
  storeForm.password = '';
  storeForm.imageUrl = '';
  storeForm.status = 1;
  storeForm.deptId = '';
  storeForm.remark = '';
}

function openCreateStore() {
  resetStoreForm();
  storeDialogOpen.value = true;
}

function openEditStore(row: XqStorePlatformApi.Store) {
  storeForm.id = row.id;
  storeForm.name = row.name;
  storeForm.platformId = row.platformId;
  storeForm.sourceStoreId = row.sourceStoreId;
  storeForm.account = row.account || '';
  storeForm.password = '';
  storeForm.imageUrl = row.imageUrl || '';
  storeForm.status = row.status ?? 1;
  storeForm.deptId = row.deptId || '';
  storeForm.remark = row.remark || '';
  storeDialogOpen.value = true;
}

async function handleSaveStore() {
  if (!storeForm.name.trim() || !storeForm.platformId) {
    message.warning('请填写店铺名称并选择平台');
    return;
  }
  saving.value = true;
  try {
    await saveXqStore({
      ...storeForm,
      name: storeForm.name.trim(),
      account: storeForm.account?.trim() || undefined,
      password: storeForm.password?.trim() || undefined,
      imageUrl: storeForm.imageUrl?.trim() || undefined,
      deptId: storeForm.deptId?.trim() || undefined,
      remark: storeForm.remark?.trim() || undefined,
    });
    message.success('店铺已保存');
    storeDialogOpen.value = false;
    await Promise.all([loadStores(), loadPlatforms()]);
  } catch (error: any) {
    message.error(error?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

function handleDeleteStore(row: XqStorePlatformApi.Store) {
  Modal.confirm({
    title: '删除店铺？',
    content: `确认删除「${row.name}」？`,
    async onOk() {
      await deleteXqStore(row.id);
      message.success('已删除');
      await Promise.all([loadStores(), loadPlatforms()]);
    },
  });
}

function resetAliasForm() {
  aliasForm.id = undefined;
  aliasForm.platformId = platforms.value[0]?.id || 0;
  aliasForm.alias = '';
}

function openCreateAlias() {
  resetAliasForm();
  aliasDialogOpen.value = true;
}

function openEditAlias(row: XqStorePlatformApi.Alias) {
  aliasForm.id = row.id;
  aliasForm.platformId = row.platformId;
  aliasForm.alias = row.alias;
  aliasDialogOpen.value = true;
}

async function handleSaveAlias() {
  if (!aliasForm.platformId || !aliasForm.alias.trim()) {
    message.warning('请选择平台并填写别名');
    return;
  }
  saving.value = true;
  try {
    await saveXqPlatformAlias({
      ...aliasForm,
      alias: aliasForm.alias.trim(),
    });
    message.success('别名已保存');
    aliasDialogOpen.value = false;
    await loadAliases();
  } catch (error: any) {
    message.error(error?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

function handleDeleteAlias(row: XqStorePlatformApi.Alias) {
  Modal.confirm({
    title: '删除别名？',
    content: `确认删除「${row.alias}」？`,
    async onOk() {
      await deleteXqPlatformAlias(row.id);
      message.success('已删除');
      await loadAliases();
    },
  });
}

async function loadUserBind() {
  if (!bindUserId.value) {
    bindStoreIds.value = [];
    bindRestricted.value = false;
    return;
  }
  bindLoading.value = true;
  try {
    const res = await getXqUserStores(bindUserId.value);
    bindStoreIds.value = res?.storeIds || [];
    bindRestricted.value = !!res?.restricted;
  } catch (error: any) {
    message.error(error?.message || '加载绑定失败');
  } finally {
    bindLoading.value = false;
  }
}

async function handleSaveBind() {
  if (!bindUserId.value) {
    message.warning('请先选择用户');
    return;
  }
  bindSaving.value = true;
  try {
    await bindXqUserStores(bindUserId.value, bindStoreIds.value);
    message.success(
      bindStoreIds.value.length > 0
        ? `已绑定 ${bindStoreIds.value.length} 个店铺`
        : '已清空绑店（不限店）',
    );
    await loadUserBind();
  } catch (error: any) {
    message.error(error?.message || '绑定失败');
  } finally {
    bindSaving.value = false;
  }
}

function togglePlatformStores(
  list: XqStorePlatformApi.Store[],
  checked: boolean,
) {
  const ids = new Set(bindStoreIds.value);
  for (const s of list) {
    if (checked) ids.add(s.id);
    else ids.delete(s.id);
  }
  bindStoreIds.value = [...ids];
}

function isPlatformAllChecked(list: XqStorePlatformApi.Store[]) {
  return (
    list.length > 0 && list.every((s) => bindStoreIds.value.includes(s.id))
  );
}

function selectAllVisible() {
  bindStoreIds.value = bindableStores.value.map((s) => s.id);
}

function clearVisible() {
  const visible = new Set(bindableStores.value.map((s) => s.id));
  bindStoreIds.value = bindStoreIds.value.filter((id) => !visible.has(id));
}

watch(storeFilterPlatformId, () => {
  loadStores(false).catch(() => undefined);
});

watch(bindUserId, () => {
  loadUserBind().catch(() => undefined);
});

onMounted(loadAll);
</script>

<template>
  <Page auto-content-height>
    <div class="space-y-4 p-1">
      <div class="rounded-lg border border-border bg-card p-4">
        <div class="mb-3 flex items-center justify-between">
          <div class="text-base font-semibold">店铺平台</div>
          <Space>
            <Button :loading="loading" @click="loadAll">刷新</Button>
            <Button type="primary" :loading="syncing" @click="handleSync">
              同步旧库
            </Button>
          </Space>
        </div>

        <Tabs v-model:active-key="activeTab">
          <TabPane key="platform" tab="平台">
            <div class="mb-3 flex justify-end">
              <Button type="primary" @click="openCreatePlatform">
                新增平台
              </Button>
            </div>
            <Table
              :loading="loading"
              :columns="platformColumns"
              :data-source="platforms"
              :pagination="false"
              row-key="id"
              size="small"
              :scroll="{ x: 1000 }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'enabled'">
                  <Tag
                    :color="record.enabled === false ? 'default' : 'processing'"
                  >
                    {{ record.enabled === false ? '停用' : '启用' }}
                  </Tag>
                </template>
                <template v-else-if="column.key === 'actions'">
                  <Space>
                    <Button
                      type="link"
                      size="small"
                      @click="openEditPlatform(record)"
                    >
                      编辑
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      danger
                      @click="handleDeletePlatform(record)"
                    >
                      删除
                    </Button>
                  </Space>
                </template>
              </template>
            </Table>
          </TabPane>

          <TabPane key="store" tab="店铺（含卖家凭据）">
            <div class="mb-3 flex items-center justify-between gap-3">
              <Select
                v-model:value="storeFilterPlatformId"
                allow-clear
                placeholder="按平台筛选"
                class="w-56"
                :options="platformOptions"
              />
              <Button type="primary" @click="openCreateStore">新增店铺</Button>
            </div>
            <Table
              :loading="loading"
              :columns="storeColumns"
              :data-source="stores"
              :pagination="false"
              row-key="id"
              size="small"
              :scroll="{ x: 1100 }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'platform'">
                  <div>{{ record.platformName || '-' }}</div>
                  <div class="text-xs text-muted-foreground">
                    {{ record.platformCode }}
                  </div>
                </template>
                <template v-else-if="column.key === 'password'">
                  <span v-if="record.hasPassword">{{
                    record.passwordMask || '******'
                  }}</span>
                  <span v-else class="text-muted-foreground">未设置</span>
                </template>
                <template v-else-if="column.key === 'status'">
                  <Tag :color="record.status === 0 ? 'default' : 'success'">
                    {{ record.status === 0 ? '停用' : '启用' }}
                  </Tag>
                </template>
                <template v-else-if="column.key === 'actions'">
                  <Space>
                    <Button
                      type="link"
                      size="small"
                      @click="openEditStore(record)"
                    >
                      编辑
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      danger
                      @click="handleDeleteStore(record)"
                    >
                      删除
                    </Button>
                  </Space>
                </template>
              </template>
            </Table>
          </TabPane>

          <TabPane key="alias" tab="别名映射">
            <div class="mb-3 flex justify-end">
              <Button type="primary" @click="openCreateAlias">新增映射</Button>
            </div>
            <Table
              :loading="loading"
              :columns="aliasColumns"
              :data-source="aliases"
              :pagination="false"
              row-key="id"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'actions'">
                  <Space>
                    <Button
                      type="link"
                      size="small"
                      @click="openEditAlias(record)"
                    >
                      编辑
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      danger
                      @click="handleDeleteAlias(record)"
                    >
                      删除
                    </Button>
                  </Space>
                </template>
              </template>
            </Table>
          </TabPane>

          <TabPane key="bind" tab="用户绑店">
            <div class="bind-toolbar">
              <Select
                v-model:value="bindUserId"
                show-search
                option-filter-prop="label"
                placeholder="选择系统用户"
                class="w-72"
                :options="userOptions"
                allow-clear
              />
              <Input
                v-model:value="bindKeyword"
                allow-clear
                placeholder="搜索店铺 / 平台"
                class="w-56"
              />
              <Button
                :disabled="!bindUserId || bindLoading"
                @click="selectAllVisible"
              >
                全选当前
              </Button>
              <Button
                :disabled="!bindUserId || bindLoading"
                @click="clearVisible"
              >
                清空当前
              </Button>
              <Button
                type="primary"
                :loading="bindSaving"
                :disabled="!bindUserId"
                @click="handleSaveBind"
              >
                保存绑定
              </Button>
              <Tag
                v-if="bindUserId"
                :color="bindRestricted ? 'orange' : 'blue'"
              >
                {{
                  bindRestricted
                    ? `已绑 ${bindSelectedCount} 店`
                    : '不限店（未勾选）'
                }}
              </Tag>
            </div>

            <div v-if="!bindUserId" class="bind-empty">
              <Empty description="请先选择系统用户，再勾选可使用的店铺" />
            </div>

            <Checkbox.Group
              v-else
              v-model:value="bindStoreIds"
              class="bind-group"
              :disabled="bindLoading"
            >
              <div
                v-for="group in storesByPlatform"
                :key="group.platform"
                class="platform-block"
              >
                <div class="platform-head">
                  <span class="platform-name">{{ group.platform }}</span>
                  <span class="platform-count">{{ group.list.length }} 店</span>
                  <Button
                    type="link"
                    size="small"
                    @click="
                      togglePlatformStores(
                        group.list,
                        !isPlatformAllChecked(group.list),
                      )
                    "
                  >
                    {{
                      isPlatformAllChecked(group.list) ? '取消本组' : '全选本组'
                    }}
                  </Button>
                </div>
                <div class="store-grid">
                  <label
                    v-for="s in group.list"
                    :key="s.id"
                    class="store-card"
                    :class="{ checked: bindStoreIds.includes(s.id) }"
                  >
                    <Checkbox :value="s.id">
                      <div class="store-name">{{ s.name }}</div>
                    </Checkbox>
                  </label>
                </div>
              </div>
              <Empty
                v-if="!storesByPlatform.length"
                description="没有匹配的店铺"
              />
            </Checkbox.Group>
          </TabPane>
        </Tabs>
      </div>
    </div>

    <Modal
      v-model:open="platformDialogOpen"
      :title="platformForm.id ? '编辑平台' : '新增平台'"
      :confirm-loading="saving"
      width="520px"
      destroy-on-close
      @ok="handleSavePlatform"
    >
      <Form layout="vertical" class="mt-2">
        <FormItem label="编码" required>
          <Input
            v-model:value="platformForm.code"
            placeholder="amz / wayfair"
          />
        </FormItem>
        <FormItem label="名称" required>
          <Input v-model:value="platformForm.name" />
        </FormItem>
        <FormItem label="原库平台 ID">
          <Input v-model:value="platformForm.sourcePlatformId" />
        </FormItem>
        <FormItem label="排序">
          <InputNumber v-model:value="platformForm.sort" class="w-full" />
        </FormItem>
        <FormItem label="启用">
          <Switch v-model:checked="platformForm.enabled" />
        </FormItem>
        <FormItem label="备注">
          <Textarea v-model:value="platformForm.remark" :rows="2" />
        </FormItem>
      </Form>
    </Modal>

    <Modal
      v-model:open="storeDialogOpen"
      :title="storeForm.id ? '编辑店铺' : '新增店铺'"
      :confirm-loading="saving"
      width="560px"
      destroy-on-close
      @ok="handleSaveStore"
    >
      <Form layout="vertical" class="mt-2">
        <FormItem label="店铺名称" required>
          <Input v-model:value="storeForm.name" />
        </FormItem>
        <FormItem label="所属平台" required>
          <Select
            v-model:value="storeForm.platformId"
            :options="platformOptions"
          />
        </FormItem>
        <FormItem label="同步来源店铺 ID">
          <InputNumber v-model:value="storeForm.sourceStoreId" class="w-full" />
        </FormItem>
        <FormItem label="卖家登录账号">
          <Input v-model:value="storeForm.account" />
        </FormItem>
        <FormItem :label="storeForm.id ? '卖家密码（留空不改）' : '卖家密码'">
          <InputPassword v-model:value="storeForm.password" />
        </FormItem>
        <FormItem label="启用">
          <Switch
            :checked="storeForm.status !== 0"
            @update:checked="(v: boolean) => (storeForm.status = v ? 1 : 0)"
          />
        </FormItem>
        <FormItem label="备注">
          <Textarea v-model:value="storeForm.remark" :rows="2" />
        </FormItem>
      </Form>
    </Modal>

    <Modal
      v-model:open="aliasDialogOpen"
      :title="aliasForm.id ? '编辑别名' : '新增别名'"
      :confirm-loading="saving"
      width="480px"
      destroy-on-close
      @ok="handleSaveAlias"
    >
      <Form layout="vertical" class="mt-2">
        <FormItem label="平台" required>
          <Select
            v-model:value="aliasForm.platformId"
            :options="platformOptions"
          />
        </FormItem>
        <FormItem label="别名" required>
          <Input v-model:value="aliasForm.alias" />
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>

<style scoped>
.bind-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}

.bind-empty {
  padding: 48px 0;
}

.bind-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: calc(100vh - 320px);
  overflow: auto;
}

.platform-block {
  padding: 12px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.platform-head {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
}

.platform-name {
  font-size: 14px;
  font-weight: 600;
}

.platform-count {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.store-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
}

.store-card {
  display: flex;
  align-items: center;
  min-height: 40px;
  padding: 6px 10px;
  cursor: pointer;
  background: #fff;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
}

.store-card:hover {
  border-color: #91caff;
}

.store-card.checked {
  background: #e6f4ff;
  border-color: #1677ff;
}

.store-name {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  line-height: 1.4;
  white-space: nowrap;
}

:deep(.bind-group .ant-checkbox-wrapper) {
  display: flex;
  width: 100%;
  margin: 0;
}
</style>
