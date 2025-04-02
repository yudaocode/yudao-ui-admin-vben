<script lang="ts" setup>
import type { SystemMenuApi } from '#/api/system/menu';
import type { Recordable } from '@vben/types';
import type { VbenFormSchema } from '#/adapter/form';

import { $t } from '#/locales';
import { computed, h, ref } from 'vue';
import { componentKeys } from '#/router/routes';
import { useVbenForm, z } from '#/adapter/form';
import { createMenu, getMenu, updateMenu } from '#/api/system/menu';
import { getMenuList } from '#/api/system/menu';
import { DICT_TYPE, getDictOptions } from '#/utils/dict';
import { handleTree } from '#/utils/tree';
import { CommonStatusEnum, SystemMenuTypeEnum } from '#/utils/constants';
import { isHttpUrl } from '@vben/utils';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { message } from 'ant-design-vue';

const emit = defineEmits(['success']);
const formData = ref<SystemMenuApi.SystemMenu>();
const getTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', ['菜单'])
    : $t('ui.actionTitle.create', ['菜单']),
);
const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'id',
    dependencies: {
      triggerFields: [''],
      show: () => false,
    },
  },
  {
    fieldName: 'parentId',
    label: '上级菜单',
    component: 'ApiTreeSelect',
    componentProps: {
      allowClear: true,
      api: async () => {
        const data = await getMenuList();
        data.unshift({
          id: 0,
          name: '顶级部门',
        } as SystemMenuApi.SystemMenu);
        return handleTree(data);
      },
      class: 'w-full',
      labelField: 'name',
      valueField: 'id',
      childrenField: 'children',
      placeholder: '请选择上级菜单',
      filterTreeNode(input: string, node: Recordable<any>) {
        if (!input || input.length === 0) {
          return true;
        }
        const name: string = node.label ?? '';
        if (!name) return false;
        return name.includes(input) || $t(name).includes(input);
      },
      showSearch: true,
      treeDefaultExpandedKeys: [0],
    },
    rules: 'selectRequired',
    renderComponentContent() {
      return {
        title({ label, icon }: { label: string; icon: string }) {
          const components = [];
          if (!label) return '';
          if (icon) {
            components.push(h(IconifyIcon, { class: 'size-4', icon }));
          }
          components.push(h('span', { class: '' }, $t(label || '')));
          return h('div', { class: 'flex items-center gap-1' }, components);
        },
      };
    },
  },
  {
    fieldName: 'name',
    label: '菜单名称',
    component: 'Input',
    componentProps: {
      placeholder: '请输入菜单名称',
    },
    rules: 'required',
  },
  {
    fieldName: 'type',
    label: '菜单类型',
    component: 'RadioGroup',
    componentProps: {
      options: getDictOptions(DICT_TYPE.SYSTEM_MENU_TYPE, 'number'),
      buttonStyle: 'solid',
      optionType: 'button',
    },
    rules: z.number().default(SystemMenuTypeEnum.DIR),
  },
  {
    fieldName: 'icon',
    label: '菜单图标',
    component: 'IconPicker',
    componentProps: {
      placeholder: '请选择菜单图标',
      prefix: 'carbon',
    },
    rules: 'required',
    dependencies: {
      triggerFields: ['type'],
      show: (values) => {
        return [SystemMenuTypeEnum.DIR, SystemMenuTypeEnum.MENU].includes(values.type);
      },
    },
  },
  {
    fieldName: 'path',
    label: '路由地址',
    component: 'Input',
    componentProps: {
      placeholder: '请输入路由地址',
    },
    rules: z.string(),
    help: '访问的路由地址，如：`user`。如需外网地址时，则以 `http(s)://` 开头',
    dependencies: {
      triggerFields: ['type', 'parentId'],
      show: (values) => {
        return [SystemMenuTypeEnum.DIR, SystemMenuTypeEnum.MENU].includes(values.type);
      },
      rules: (values) => {
        const schema = z.string().min(1, '路由地址不能为空');
        if (isHttpUrl(values.path)) {
          return schema;
        }
        if (values.parentId === 0) {
          return schema.refine((path) => path.charAt(0) === '/', '路径必须以 / 开头');
        }
        return schema.refine((path) => path.charAt(0) !== '/', '路径不能以 / 开头');
      },
    }
  },
  {
    fieldName: 'component',
    label: '组件地址',
    component: 'Input',
    componentProps: {
      placeholder: '请输入组件地址',
    },
    dependencies: {
      triggerFields: ['type'],
      show: (values) => {
        return [SystemMenuTypeEnum.MENU].includes(values.type);
      }
    },
  },
  {
    fieldName: 'componentName',
    label: '组件名称',
    component: 'AutoComplete',
    componentProps: {
      allowClear: true,
      class: 'w-full',
      filterOption(input: string, option: { value: string }) {
        return option.value.toLowerCase().includes(input.toLowerCase());
      },
      placeholder: '请选择组件名称',
      options: componentKeys.map((v) => ({ value: v })),
    },
    dependencies: {
      triggerFields: ['type'],
      show: (values) => {
        return [SystemMenuTypeEnum.MENU].includes(values.type);
      }
    },
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入菜单描述',
    },
    dependencies: {
      show: (values) => {
        return [SystemMenuTypeEnum.MENU, SystemMenuTypeEnum.BUTTON].includes(
          values.type,
        );
      },
      triggerFields: ['type'],
    },
    fieldName: 'permission',
    label: '权限标识',
  },
  {
    component: 'InputNumber',
    componentProps: {
      min: 0,
      class: 'w-full',
      controlsPosition: 'right',
      placeholder: '请输入菜单顺序',
    },
    fieldName: 'sort',
    label: '菜单顺序',
    rules: 'required',
  },
  {
    component: 'RadioGroup',
    componentProps: {
      options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
      buttonStyle: 'solid',
      optionType: 'button',
    },
    fieldName: 'status',
    label: '菜单状态',
    rules: z.number().default(CommonStatusEnum.ENABLE),
  },
  {
    fieldName: 'alwaysShow',
    label: '总是显示',
    component: 'RadioGroup',
    componentProps: {
      options: [
        { label: '总是', value: true },
        { label: '不是', value: false },
      ],
      buttonStyle: 'solid',
      optionType: 'button',
    },
    rules: 'required',
    defaultValue: true,
    help: '选择不是时，当该菜单只有一个子菜单时，不展示自己，直接展示子菜单',
    dependencies: {
      triggerFields: ['type'],
      show: (values) => {
        return [SystemMenuTypeEnum.MENU].includes(values.type);
      },
    },
  },
  {
    fieldName: 'keepAlive',
    label: '缓存状态',
    component: 'RadioGroup',
    componentProps: {
      options: [
        { label: '缓存', value: true },
        { label: '不缓存', value: false },
      ],
      buttonStyle: 'solid',
      optionType: 'button',
    },
    rules: 'required',
    defaultValue: true,
    help: '选择缓存时，则会被 `keep-alive` 缓存，必须填写「组件名称」字段',
    dependencies: {
      triggerFields: ['type'],
      show: (values) => {
        return [SystemMenuTypeEnum.MENU].includes(values.type);
      },
    },
  },
];

const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  schema,
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    const data = (await formApi.getValues()) as SystemMenuApi.SystemMenu;
    try {
      await (formData.value?.id ? updateMenu(data) : createMenu(data));
      await modalApi.close();
      emit('success');
      message.success({
        content: $t('ui.actionMessage.operationSuccess'),
        key: 'action_process_msg',
      });
    } finally {
      modalApi.lock(false);
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }
    let data = modalApi.getData<SystemMenuApi.SystemMenu>();
    if (!data) {
      return;
    }
    if (data.id) {
      modalApi.lock();
      try {
        data = await getMenu(data.id as number);
      } finally {
        modalApi.lock(false);
      }
    }
    formData.value = data;
    await formApi.setValues(formData.value);
  },
});
</script>
<template>
  <Modal :title="getTitle">
    <Form class="mx-4" />
  </Modal>
</template>
