<script setup lang="ts">
import type { Ref } from 'vue';

import type { ProductVO } from '#/api/iot/product/product';

import { inject, onMounted, ref } from 'vue';

import hljs from 'highlight.js'; // 导入代码高亮文件
import json from 'highlight.js/lib/languages/json';

import { getThingModelListByProductId } from '#/api/iot/thingmodel';
import { IOT_PROVIDE_KEY } from '#/views/iot/utils/constants';

import 'highlight.js/styles/github.css'; // 导入代码高亮样式

defineOptions({ name: 'ThingModelTSL' });

const dialogVisible = ref(false); // 弹窗的是否展示
const dialogTitle = ref('物模型 TSL'); // 弹窗的标题
const product = inject<Ref<ProductVO>>(IOT_PROVIDE_KEY.PRODUCT); // 注入产品信息
const viewMode = ref('code'); // 查看模式：code-代码视图，editor-编辑器视图

/** 打开弹窗 */
function open() {
  dialogVisible.value = true;
}
defineExpose({ open });

/** 获取 TSL */
const thingModelTSL = ref({});
async function getTsl() {
  thingModelTSL.value = await getThingModelListByProductId(
    product?.value?.id || 0,
  );
}

/** 初始化 */
onMounted(async () => {
  // 注册代码高亮的各种语言
  hljs.registerLanguage('json', json);
  await getTsl();
});
</script>

<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <JsonEditor
      v-model="thingModelTSL"
      :mode="viewMode === 'editor' ? 'code' : 'view'"
      height="600px"
    />
    <template #footer>
      <el-radio-group v-model="viewMode" size="small">
        <el-radio-button label="code">代码视图</el-radio-button>
        <el-radio-button label="editor">编辑器视图</el-radio-button>
      </el-radio-group>
    </template>
  </Dialog>
</template>
