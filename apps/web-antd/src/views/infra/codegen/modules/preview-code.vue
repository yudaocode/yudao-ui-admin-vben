<script lang="ts" setup>
import type { InfraCodegenApi } from '#/api/infra/codegen';

import { computed, h, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { Copy } from '@vben/icons';

import { useClipboard } from '@vueuse/core';
import { Button, message, Tree } from 'ant-design-vue';
import hljs from 'highlight.js/lib/core';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';

import { previewCodegen } from '#/api/infra/codegen';

/** 注册代码高亮语言 */
hljs.registerLanguage('java', java);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('vue', xml);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('typescript', typescript);

/** 文件树类型 */
interface FileNode {
  key: string;
  title: string;
  parentKey: string;
  isLeaf?: boolean;
  children?: FileNode[];
}

/** 组件状态 */
const loading = ref(false);
const fileTree = ref<FileNode[]>([]);
const previewFiles = ref<InfraCodegenApi.CodegenPreview[]>([]);
const activeKey = ref<string>('');
const highlightedCode = ref<string>('');

/** 当前活动文件的语言 */
const activeLanguage = computed(() => {
  return activeKey.value.split('.').pop() || '';
});

/** 复制代码 */
const copyCode = async () => {
  const { copy } = useClipboard();
  const file = previewFiles.value.find(
    (item) => item.filePath === activeKey.value,
  );
  if (file) {
    await copy(file.code);
    message.success('复制成功');
  }
};

/** 文件节点点击事件 */
const handleNodeClick = (_: any[], e: any) => {
  // TODO @puhui999：可以简化，if return；减少括号
  if (e.node.isLeaf) {
    activeKey.value = e.node.key;
    const file = previewFiles.value.find(
      (item) => item.filePath === activeKey.value,
    );
    if (file) {
      const lang = file.filePath.split('.').pop() || '';
      try {
        highlightedCode.value = hljs.highlight(file.code, {
          language: lang,
        }).value;
      } catch {
        highlightedCode.value = file.code;
      }
    }
  }
};

/** 处理文件树 */
// TODO @puhui999：看看能不能用 cursor 优化下这个方法；= = 比较冗余
const handleFiles = (data: InfraCodegenApi.CodegenPreview[]): FileNode[] => {
  const exists: Record<string, boolean> = {};
  const files: FileNode[] = [];

  // 处理文件路径
  for (const item of data) {
    const paths = item.filePath.split('/');
    let fullPath = '';

    // 处理Java文件路径
    const newPaths = [];
    let i = 0;
    while (i < paths.length) {
      const path = paths[i];

      if (path === 'java' && i + 1 < paths.length) {
        newPaths.push(path);

        // 合并包路径
        let packagePath = '';
        i++;
        while (i < paths.length) {
          const nextPath = paths[i] || '';
          if (['controller','convert','dal','dataobject','enums','mysql','service','vo'].includes(nextPath)) {
            break;
          }
          packagePath = packagePath ? `${packagePath}.${nextPath}` : nextPath;
          i++;
        }

        if (packagePath) {
          newPaths.push(packagePath);
        }
        continue;
      }

      newPaths.push(path);
      i++;
    }

    // 构建文件树
    for (let i = 0; i < newPaths.length; i++) {
      const oldFullPath = fullPath;
      fullPath =
        fullPath.length === 0
          ? newPaths[i] || ''
          : `${fullPath.replaceAll('.', '/')}/${newPaths[i]}`;

      if (exists[fullPath]) {
        continue;
      }

      exists[fullPath] = true;
      files.push({
        key: fullPath,
        title: newPaths[i] || '',
        parentKey: oldFullPath || '/',
        isLeaf: i === newPaths.length - 1,
      });
    }
  }

  /** 构建树形结构 */
  const buildTree = (parentKey: string): FileNode[] => {
    return files
      .filter((file) => file.parentKey === parentKey)
      .map((file) => ({
        ...file,
        children: buildTree(file.key),
      }));
  };

  return buildTree('/');
};

/** 模态框实例 */
const [Modal, modalApi] = useVbenModal({
  footer: false,
  class: 'w-3/5',
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      // TODO @puhui999：貌似下面不要，也没关系？
      previewFiles.value = [];
      fileTree.value = [];
      activeKey.value = '';
      highlightedCode.value = '';
      return;
    }

    const row = modalApi.getData<InfraCodegenApi.CodegenTable>();
    if (!row) return;

    // 加载预览数据
    loading.value = true;
    try {
      const data = await previewCodegen(row.id);
      previewFiles.value = data;

      // 构建代码树，并默认选中第一个文件
      fileTree.value = handleFiles(data);
      if (data.length > 0) {
        activeKey.value = data[0]?.filePath || '';
        const lang = activeKey.value.split('.').pop() || '';
        const code = data[0]?.code || '';
        try {
          highlightedCode.value = hljs.highlight(code, {
            language: lang,
          }).value;
        } catch {
          highlightedCode.value = code;
        }
      }
    } finally {
      loading.value = false;
    }
  },
});
</script>

<template>
  <Modal title="代码预览">
    <div class="h-full flex" v-loading="loading">
      <!-- 文件树 -->
      <div class="w-1/3 border-r border-gray-200 pr-4 dark:border-gray-700">
        <!-- TODO @puhui999：树默认展示； -->
        <!-- TODO @puhui999：默认节点点击，可以展开 -->
        <Tree
          :selected-keys="[activeKey]"
          :tree-data="fileTree"
          @select="handleNodeClick"
        />
      </div>
      <!-- 代码预览 -->
      <!-- TODO @puhui999：可以顶部有个 tab 么？ -->
      <!-- TODO @puhui999：貌似 java 的缩进，不太对，首行空了很长； -->
      <div class="w-2/3 pl-4">
        <div class="mb-2 flex justify-between">
          <div class="text-lg font-medium dark:text-gray-200">
            {{ activeKey.split('/').pop() }}
            <!-- TODO @puhui999：貌似不用 activeLanguage 哇？ -->
            <span class="ml-2 text-xs text-gray-500 dark:text-gray-400">
              ({{ activeLanguage }})
            </span>
          </div>
          <!-- TODO @芋艿：貌似别的模块，也可以通过 :icon="h(Copy)"？？？ -->
          <Button type="primary" ghost @click="copyCode" :icon="h(Copy)">
            复制代码
          </Button>
        </div>
        <div class="h-[calc(100%-40px)] overflow-auto">
          <pre
            class="overflow-auto rounded-md bg-gray-50 p-4 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
          >
            <!-- eslint-disable-next-line vue/no-v-html -->
            <code v-html="highlightedCode" class="code-highlight"></code>
          </pre>
        </div>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
/* stylelint-disable selector-class-pattern */

/* 代码高亮样式 - 支持暗黑模式 */
:deep(.code-highlight) {
  background: transparent;
}

/* 关键字 */
:deep(.hljs-keyword) {
  @apply text-purple-600 dark:text-purple-400;
}

/* 字符串 */
:deep(.hljs-string) {
  @apply text-green-600 dark:text-green-400;
}

/* 注释 */
:deep(.hljs-comment) {
  @apply text-gray-500 dark:text-gray-400;
}

/* 函数 */
:deep(.hljs-function) {
  @apply text-blue-600 dark:text-blue-400;
}

/* 数字 */
:deep(.hljs-number) {
  @apply text-orange-600 dark:text-orange-400;
}

/* 类 */
:deep(.hljs-class) {
  @apply text-yellow-600 dark:text-yellow-400;
}

/* 标题/函数名 */
:deep(.hljs-title) {
  @apply font-bold text-blue-600 dark:text-blue-400;
}

/* 参数 */
:deep(.hljs-params) {
  @apply text-gray-700 dark:text-gray-300;
}

/* 内置对象 */
:deep(.hljs-built_in) {
  @apply text-teal-600 dark:text-teal-400;
}

/* HTML标签 */
:deep(.hljs-tag) {
  @apply text-blue-600 dark:text-blue-400;
}

/* 属性 */
:deep(.hljs-attribute),
:deep(.hljs-attr) {
  @apply text-green-600 dark:text-green-400;
}

/* 字面量 */
:deep(.hljs-literal) {
  @apply text-purple-600 dark:text-purple-400;
}

/* 元信息 */
:deep(.hljs-meta) {
  @apply text-gray-500 dark:text-gray-400;
}

/* 选择器标签 */
:deep(.hljs-selector-tag) {
  @apply text-blue-600 dark:text-blue-400;
}

/* XML/HTML名称 */
:deep(.hljs-name) {
  @apply text-blue-600 dark:text-blue-400;
}

/* 变量 */
:deep(.hljs-variable) {
  @apply text-orange-600 dark:text-orange-400;
}

/* 属性 */
:deep(.hljs-property) {
  @apply text-red-600 dark:text-red-400;
}
/* stylelint-enable selector-class-pattern */
</style>
