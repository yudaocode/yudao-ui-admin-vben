<script lang="ts" setup>
import type { XqListingApi } from '#/api/xq/listing';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Empty,
  Input,
  message,
  Spin,
  Switch,
  Tag,
  Textarea,
  Tree,
} from 'ant-design-vue';

import {
  getXqImageRule,
  getXqImageRules,
  getXqListingCategories,
  getXqListingPlatforms,
  saveXqImageRule,
} from '#/api/xq/listing';
import { useDeskPlatformId } from '#/views/xq/desk/use-desk-scope';

const loading = ref(false);
const saving = ref(false);
const catLoading = ref(false);
const platforms = ref<XqListingApi.Platform[]>([]);
const categoryTree = ref<XqListingApi.CategoryNode[]>([]);
const configuredRules = ref<XqListingApi.ImageRule[]>([]);
const lockedPlatformId = useDeskPlatformId();
const activePlatformId = ref<string>('');
/** 空字符串 = 平台默认提示词 */
const activeCategoryId = ref<string>('');
const activeCategoryName = ref<string>('平台默认');
const selectedTreeKeys = ref<string[]>(['__default__']);

const form = reactive({
  name: '图片提示词规则',
  enabled: true,
  remark: '',
  promptText: '',
  negativePrompt: '',
});

const configuredIds = computed(() => {
  const set = new Set<string>();
  for (const r of configuredRules.value) {
    set.add(r.categoryId || '');
  }
  return set;
});

const treeData = computed(() => {
  const mapNodes = (
    nodes: XqListingApi.CategoryNode[],
  ): Array<Record<string, any>> =>
    (nodes || []).map((n) => {
      const configured = configuredIds.value.has(n.id);
      return {
        key: n.id,
        title: configured ? `${n.name} · 已配` : n.name,
        children: n.children?.length ? mapNodes(n.children) : undefined,
      };
    });
  const defaultConfigured = configuredIds.value.has('');
  return [
    {
      key: '__default__',
      title: defaultConfigured ? '平台默认提示词 · 已配' : '平台默认提示词',
      children: undefined,
    },
    ...mapNodes(categoryTree.value),
  ];
});

function findCategoryName(
  nodes: XqListingApi.CategoryNode[],
  id: string,
): string | undefined {
  for (const n of nodes || []) {
    if (n.id === id) return n.name;
    const child = findCategoryName(n.children || [], id);
    if (child) return child;
  }
  return undefined;
}

async function loadPlatforms() {
  platforms.value = (await getXqListingPlatforms()) || [];
  if (lockedPlatformId.value) {
    activePlatformId.value = lockedPlatformId.value;
    return;
  }
  if (!activePlatformId.value && platforms.value[0]) {
    activePlatformId.value = platforms.value[0].id;
  }
}

async function loadCategoriesAndRules() {
  if (!activePlatformId.value) {
    categoryTree.value = [];
    configuredRules.value = [];
    return;
  }
  catLoading.value = true;
  try {
    const [cats, rules] = await Promise.all([
      getXqListingCategories(activePlatformId.value),
      getXqImageRules(activePlatformId.value),
    ]);
    categoryTree.value = cats || [];
    configuredRules.value = rules || [];
  } catch (error: any) {
    message.error(error?.message || '加载分类/规则失败');
  } finally {
    catLoading.value = false;
  }
}

async function loadRuleForm() {
  loading.value = true;
  try {
    const rule = await getXqImageRule(
      activePlatformId.value,
      activeCategoryId.value,
    );
    form.name = rule?.name || '图片提示词规则';
    form.enabled = rule?.enabled !== false;
    form.remark = rule?.remark || '';
    form.promptText = rule?.promptText || '';
    form.negativePrompt = rule?.negativePrompt || '';
  } catch (error: any) {
    message.error(error?.message || '加载提示词失败');
  } finally {
    loading.value = false;
  }
}

async function onSelectPlatform(id: string) {
  activePlatformId.value = id;
  activeCategoryId.value = '';
  activeCategoryName.value = '平台默认';
  selectedTreeKeys.value = ['__default__'];
  await loadCategoriesAndRules();
  await loadRuleForm();
}

async function onSelectCategory(keys: Array<number | string>) {
  const key = String(keys?.[0] ?? '');
  if (!key) return;
  selectedTreeKeys.value = [key];
  if (key === '__default__') {
    activeCategoryId.value = '';
    activeCategoryName.value = '平台默认';
  } else {
    activeCategoryId.value = key;
    activeCategoryName.value = findCategoryName(categoryTree.value, key) || key;
  }
  await loadRuleForm();
}

async function handleSave() {
  if (!form.promptText.trim()) {
    message.warning('请填写主提示词');
    return;
  }
  saving.value = true;
  try {
    await saveXqImageRule({
      platformId: activePlatformId.value || '',
      categoryId: activeCategoryId.value || '',
      categoryName: activeCategoryName.value,
      name: form.name || '图片提示词规则',
      promptText: form.promptText,
      negativePrompt: form.negativePrompt,
      enabled: form.enabled,
      remark: form.remark,
      configJson: '{}',
    });
    message.success('已保存到原库图片提示词');
    await loadCategoriesAndRules();
  } catch (error: any) {
    message.error(error?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  try {
    await loadPlatforms();
    await loadCategoriesAndRules();
    await loadRuleForm();
  } catch (error: any) {
    message.error(error?.message || '初始化失败');
  }
});

watch(lockedPlatformId, async (pid) => {
  if (!pid) return;
  await onSelectPlatform(pid);
});
</script>

<template>
  <Page auto-content-height>
    <div class="xq-img-rule">
      <div class="xq-img-rule-head">
        <div>
          <h2>图片管理</h2>
          <p>
            {{
              lockedPlatformId
                ? '当前平台按分类配置生图提示词。'
                : '按上架平台 + 分类配置不同生图提示词，数据写入原库 t_giga_image_gen_rule。'
            }}
          </p>
        </div>
        <Button type="primary" :loading="saving" @click="handleSave">
          保存提示词
        </Button>
      </div>

      <div
        class="xq-img-rule-layout"
        :class="{ 'is-locked': !!lockedPlatformId }"
      >
        <div v-if="!lockedPlatformId" class="xq-img-rule-side">
          <div class="side-title">平台</div>
          <button
            v-for="p in platforms"
            :key="p.id"
            class="side-item"
            type="button"
            :class="{ active: activePlatformId === p.id }"
            @click="onSelectPlatform(p.id)"
          >
            <span>{{ p.name }}</span>
            <span class="code">{{ p.code }}</span>
          </button>
          <Empty
            v-if="!platforms.length"
            :image="Empty.PRESENTED_IMAGE_SIMPLE"
            description="暂无平台"
          />
        </div>

        <div class="xq-img-rule-cats">
          <div class="side-title">
            分类
            <Tag v-if="configuredRules.length" color="blue">
              已配 {{ configuredRules.length }}
            </Tag>
          </div>
          <Spin :spinning="catLoading">
            <Tree
              v-if="treeData.length"
              :tree-data="treeData"
              :selected-keys="selectedTreeKeys"
              :default-expand-all="false"
              show-line
              @select="onSelectCategory"
            />
            <Empty
              v-else-if="!catLoading"
              :image="Empty.PRESENTED_IMAGE_SIMPLE"
              description="该平台暂无分类"
            />
          </Spin>
        </div>

        <div class="xq-img-rule-main">
          <Spin :spinning="loading">
            <div class="current-path">
              当前：
              <b>{{
                platforms.find((p) => p.id === activePlatformId)?.name || '—'
              }}</b>
              /
              <b>{{ activeCategoryName }}</b>
            </div>
            <div class="field">
              <label>规则名称</label>
              <Input v-model:value="form.name" />
            </div>
            <div class="field row">
              <label>启用</label>
              <Switch v-model:checked="form.enabled" />
            </div>
            <div class="field">
              <label>主提示词（Prompt）</label>
              <Textarea
                v-model:value="form.promptText"
                :rows="10"
                placeholder="针对该分类的生图提示词，例如风格、构图、背景、材质要求…"
              />
            </div>
            <div class="field">
              <label>反向提示词（Negative，可选）</label>
              <Textarea
                v-model:value="form.negativePrompt"
                :rows="4"
                placeholder="不希望出现的元素，如 watermark, text, blurry…"
              />
            </div>
            <div class="field">
              <label>备注</label>
              <Input v-model:value="form.remark" />
            </div>
          </Spin>
        </div>
      </div>
    </div>
  </Page>
</template>

<style scoped>
.xq-img-rule {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 2px 16px;
}

.xq-img-rule-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.xq-img-rule-head h2 {
  margin: 0;
  font-size: 18px;
}

.xq-img-rule-head p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6b7280;
}

.xq-img-rule-layout {
  display: grid;
  grid-template-columns: 200px 280px 1fr;
  gap: 16px;
  min-height: 560px;
}

.xq-img-rule-layout.is-locked {
  grid-template-columns: 280px 1fr;
}

.xq-img-rule-side,
.xq-img-rule-cats,
.xq-img-rule-main {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
}

.xq-img-rule-side,
.xq-img-rule-cats {
  max-height: 72vh;
  padding: 12px;
  overflow: auto;
}

.xq-img-rule-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 18px;
}

.side-title {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 700;
}

.side-item {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 12px;
  margin-bottom: 4px;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;
}

.side-item:hover,
.side-item.active {
  background: #f0f7ff;
}

.side-item .code {
  font-size: 11px;
  color: #9ca3af;
}

.cfg-tag {
  margin-left: 6px;
}

.current-path {
  margin-bottom: 4px;
  font-size: 13px;
  color: #6b7280;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.field.row {
  flex-direction: row;
  gap: 12px;
  align-items: center;
}

.field label {
  font-size: 12px;
  color: #6b7280;
}

@media (max-width: 1100px) {
  .xq-img-rule-layout {
    grid-template-columns: 1fr;
  }

  .xq-img-rule-side,
  .xq-img-rule-cats {
    max-height: 280px;
  }
}
</style>
