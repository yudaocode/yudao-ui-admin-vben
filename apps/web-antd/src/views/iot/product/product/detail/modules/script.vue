<!-- 数据解析 -->
<script lang="ts" setup>
import type { IotProductApi } from '#/api/iot/product/product';

import { computed, ref, watch } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, JsonViewer } from '@vben/common-ui';

import {
  Button,
  Card,
  Col,
  message,
  Radio,
  Row,
  Tag,
  Textarea,
} from 'ant-design-vue';

import {
  debugProductScript,
  updateProductScript,
} from '#/api/iot/product/product';
import {
  bytesToHex,
  getUtf8ByteLength,
  hexToBytes,
  sha256ShortHash,
} from '#/views/iot/utils/raw';

interface Props {
  product: IotProductApi.Product;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  refresh: [];
}>();

const SCRIPT_MAX_BYTES = 32 * 1024; // 脚本 UTF-8 最大字节数
const SCRIPT_PLACEHOLDER =
  'function decode(ctx) { ... }\nfunction encode(ctx) { ... }';
const DEBUG_HEX_PLACEHOLDER = '输入 HEX，例如 01 03 02 00 FA';
const DEBUG_JSON_PLACEHOLDER =
  '输入 JSON 消息，例如 {"method":"thing.property.set","params":{}}';

/** 调试错误类型 */
const DEBUG_ERROR_TYPE_LABELS: Record<string, string> = {
  ERROR: '运行错误',
  TIMEOUT: '执行超时',
  REJECTED: '被拒绝执行',
  OUTPUT_INVALID: '输出非法',
  ENCODE_EMPTY: '编码结果为空',
};

const { hasAccessByCodes } = useAccess();
// 是否有编辑权限（保存、启停、调试）
const canEdit = computed(() => hasAccessByCodes(['iot:product:update']));

const editorContent = ref(''); // 编辑区内容（未保存的修改只保存在页面中）
const shortHash = ref<string>(); // 已保存内容的 SHA-256 短码
const saveLoading = ref(false); // 保存中
const toggleLoading = ref(false); // 启停中

// 已保存内容
const savedContent = computed(() => props.product.scriptContent ?? '');
// 是否启用
const enabled = computed(() => props.product.scriptEnabled === true);
// 是否有未保存的修改
const dirty = computed(() => editorContent.value !== savedContent.value);
// 编辑区字节数
const editorBytes = computed(() => getUtf8ByteLength(editorContent.value));

/** 已保存内容变化时：编辑区没有未保存的修改，才同步为最新的已保存内容 */
watch(
  () => props.product.scriptContent,
  (newValue, oldValue) => {
    if (editorContent.value === (oldValue ?? '')) {
      editorContent.value = newValue ?? '';
    }
  },
  { immediate: true },
);

/** 计算已保存内容的 hash 短码 */
let hashToken = 0;
watch(
  savedContent,
  async (content) => {
    const token = ++hashToken;
    const hash = await sha256ShortHash(content);
    if (token === hashToken) {
      shortHash.value = hash;
    }
  },
  { immediate: true },
);

/** 保存并生效 */
async function handleSave() {
  if (editorBytes.value > SCRIPT_MAX_BYTES) {
    message.warning(`脚本超过 32KB（当前 ${editorBytes.value} 字节）`);
    return;
  }
  if (!editorContent.value && enabled.value) {
    message.warning('启用状态下不能清空脚本，请先停用');
    return;
  }
  try {
    await confirm(
      '保存后，连接健康时通常一个刷新周期内对该产品的全部设备生效。保存不会改变启用状态，确认保存？',
    );
  } catch {
    return;
  }
  saveLoading.value = true;
  try {
    await updateProductScript({
      id: props.product.id!,
      scriptContent: editorContent.value,
    });
    message.success(
      '已保存。连接健康时，通常一个刷新周期内对该产品的全部设备生效',
    );
    emit('refresh');
  } finally {
    saveLoading.value = false;
  }
}

/** 启用 / 停用 */
async function handleToggle(scriptEnabled: boolean) {
  toggleLoading.value = true;
  try {
    await updateProductScript({ id: props.product.id!, scriptEnabled });
    message.success(
      scriptEnabled
        ? '已启用，连接健康时通常一个刷新周期内生效'
        : '已停用，连接健康时通常一个刷新周期内生效',
    );
    emit('refresh');
  } finally {
    toggleLoading.value = false;
  }
}

/** 恢复为已保存内容 */
function handleRestore() {
  editorContent.value = savedContent.value;
}

// ========== 调试 ==========
const debugDirection = ref<'decode' | 'encode'>('decode'); // 调试方向
const debugInputHex = ref(''); // 上行解码：输入 HEX
const debugInputJson = ref(''); // 下行编码：输入 JSON 消息
const debugLoading = ref(false); // 调试中
const debugResult = ref<IotProductApi.ProductScriptDebugResp>(); // 调试结果
// 调试结果对应的方向
const debugResultDirection = ref<'decode' | 'encode'>('decode');

/** 格式化 HEX 展示 */
function formatHex(hex?: string) {
  if (!hex) {
    return '-';
  }
  const bytes = hexToBytes(hex);
  return bytes ? bytesToHex(bytes) : hex;
}

/** 调试：执行当前编辑内容 */
async function handleDebug() {
  if (!editorContent.value) {
    message.warning('请先输入脚本内容');
    return;
  }
  const data: IotProductApi.ProductScriptDebugReq = {
    id: props.product.id!,
    scriptContent: editorContent.value,
    direction: debugDirection.value,
  };
  if (debugDirection.value === 'decode') {
    if (!hexToBytes(debugInputHex.value)) {
      message.warning('请输入合法的 HEX，例如 01 03 02 00 FA');
      return;
    }
    data.inputHex = debugInputHex.value;
  } else {
    let debugMessage: any;
    try {
      debugMessage = JSON.parse(debugInputJson.value);
    } catch {
      message.warning('请输入合法的 JSON 消息');
      return;
    }
    if (
      typeof debugMessage !== 'object' ||
      debugMessage === null ||
      Array.isArray(debugMessage) ||
      typeof debugMessage.method !== 'string'
    ) {
      message.warning('JSON 消息必须是对象，并包含字符串类型的 method');
      return;
    }
    data.message = debugMessage;
  }
  debugLoading.value = true;
  try {
    debugResult.value = await debugProductScript(data);
    debugResultDirection.value = data.direction;
  } finally {
    debugLoading.value = false;
  }
}
</script>

<template>
  <Row :gutter="16">
    <!-- 左侧：脚本 -->
    <Col :span="24" :xl="canEdit ? 14 : 24">
      <Card title="数据解析">
        <div class="mb-3 flex flex-wrap items-center gap-x-6 gap-y-2">
          <span>解析模式：JS 解析</span>
          <span>
            启用状态：
            <Tag :color="enabled ? 'success' : 'default'">
              {{ enabled ? '启用' : '停用' }}
            </Tag>
          </span>
          <span>
            已保存内容：
            <span v-if="!savedContent" class="text-gray-500">未配置</span>
            <span v-else-if="shortHash" class="font-mono">
              #{{ shortHash }}
            </span>
            <span v-else class="text-gray-500">已配置</span>
          </span>
          <Tag v-if="dirty" color="warning">有未保存的修改（仅浏览器）</Tag>
        </div>
        <div v-if="canEdit" class="mb-3 flex flex-wrap gap-2">
          <Button
            :disabled="!dirty"
            :loading="saveLoading"
            type="primary"
            @click="handleSave"
          >
            保存并生效
          </Button>
          <Button
            v-if="enabled"
            :loading="toggleLoading"
            danger
            @click="handleToggle(false)"
          >
            停用
          </Button>
          <Button
            v-else
            :disabled="!savedContent"
            :loading="toggleLoading"
            @click="handleToggle(true)"
          >
            启用
          </Button>
          <Button :disabled="!dirty" @click="handleRestore">
            恢复为已保存内容
          </Button>
        </div>
        <div class="mb-2 text-sm text-gray-500">
          脚本（ES5）· UTF-8 不超过 32KB ·
          每次调用都重新执行顶层代码，不能保存状态
          <span
            class="ml-2"
            :class="{ 'text-red-500': editorBytes > SCRIPT_MAX_BYTES }"
          >
            {{ editorBytes }} / {{ SCRIPT_MAX_BYTES }} 字节
          </span>
        </div>
        <div class="mb-2 text-sm text-gray-500">
          decode 返回一条标准消息 {method, params?, requestId?, code?, msg?,
          data?}，返回 null 表示无业务消息；上报 method 只能是
          thing.property.post / thing.event.post，回执（带 code）只能是
          thing.property.set / thing.service.invoke 且必须带
          requestId；原始帧由平台自动附带，不能返回
          raw、id、deviceId、messages、ack 等字段 · encode 返回 {bytes: [...]}
          或 {standard: true}，返回 null 表示不下发
        </div>
        <Textarea
          v-model:value="editorContent"
          :auto-size="{ minRows: 18, maxRows: 36 }"
          :readonly="!canEdit"
          :spellcheck="false"
          :placeholder="SCRIPT_PLACEHOLDER"
          class="font-mono text-[13px]"
        />
        <div v-if="canEdit" class="mt-2 text-sm text-gray-500">
          保存或启停后，连接健康时通常一个刷新周期内对该产品的全部设备生效
        </div>
      </Card>
    </Col>

    <!-- 右侧：调试 -->
    <Col v-if="canEdit" :span="24" :xl="10">
      <Card title="调试">
        <Radio.Group
          v-model:value="debugDirection"
          button-style="solid"
          option-type="button"
        >
          <Radio.Button value="decode">上行解码</Radio.Button>
          <Radio.Button value="encode">下行编码</Radio.Button>
        </Radio.Group>
        <div class="my-2 text-sm text-gray-500">
          调试对象：当前编辑内容（未保存也可以），不会发送给设备
        </div>
        <Textarea
          v-if="debugDirection === 'decode'"
          v-model:value="debugInputHex"
          :placeholder="DEBUG_HEX_PLACEHOLDER"
          :rows="3"
          :spellcheck="false"
          class="font-mono"
        />
        <Textarea
          v-else
          v-model:value="debugInputJson"
          :placeholder="DEBUG_JSON_PLACEHOLDER"
          :rows="5"
          :spellcheck="false"
          class="font-mono"
        />
        <div class="mt-3">
          <Button :loading="debugLoading" type="primary" @click="handleDebug">
            调试
          </Button>
        </div>

        <!-- 调试结果 -->
        <div v-if="debugResult" class="mt-4 flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <Tag :color="debugResult.success ? 'success' : 'error'">
              {{ debugResult.success ? '成功' : '失败' }}
            </Tag>
            <span class="text-sm text-gray-500">
              耗时 {{ debugResult.durationMs }} ms
            </span>
          </div>
          <div v-if="debugResult.error" class="text-red-500">
            <Tag color="error">
              {{
                DEBUG_ERROR_TYPE_LABELS[debugResult.error.type] ||
                debugResult.error.type
              }}
            </Tag>
            <span class="break-all">{{ debugResult.error.message }}</span>
            <span v-if="debugResult.error.line">
              （第 {{ debugResult.error.line }} 行）
            </span>
          </div>
          <template
            v-if="debugResult.success && debugResultDirection === 'decode'"
          >
            <div>
              <div class="mb-1 text-sm text-gray-500">解析消息</div>
              <JsonViewer
                v-if="debugResult.message"
                :expand-depth="3"
                :value="debugResult.message"
                boxed
                copyable
              />
              <span v-else class="text-gray-500">
                无业务消息（实际上报时记录为透传上报）
              </span>
            </div>
          </template>
          <template v-else-if="debugResult.success">
            <div v-if="debugResult.standard">
              按标准编码下发（脚本返回 standard）
            </div>
            <div v-else>
              <span class="text-sm text-gray-500">输出 HEX：</span>
              <span class="break-all font-mono">
                {{ formatHex(debugResult.outputHex) }}
              </span>
            </div>
          </template>
        </div>
      </Card>
    </Col>
  </Row>
</template>
