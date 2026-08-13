<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsDigestApi } from '#/api/fms/config/digest';

import { computed, nextTick, ref } from 'vue';

import { useAccess } from '@vben/access';
import { confirm, useVbenForm, useVbenModal } from '@vben/common-ui';

import { Button, message } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createDigest,
  deleteDigest,
  getDigestSimpleList,
  updateDigest,
} from '#/api/fms/config/digest';
import { $t } from '#/locales';
import { useFmsStore } from '#/views/fms/store/fms';

import {
  useDigestLibraryFormSchema,
  useDigestLibraryGridColumns,
} from '../data';

defineOptions({ name: 'FmsDigestLibrary' });

const emit = defineEmits<{ select: [digest: string] }>();

const fmsStore = useFmsStore(); // FMS 状态
const { hasAccessByCodes } = useAccess();

const accountSetId = ref<number>(); // 当前账套编号
const formLoading = ref(false); // 表单的加载中
const editingId = ref<number>(); // 编辑中的摘要编号

/** 是否允许提交：新增需要新增权限，编辑需要修改权限 */
const canSubmit = computed(() =>
  editingId.value
    ? hasAccessByCodes(['fms:config:digest:update'])
    : hasAccessByCodes(['fms:config:digest:create']),
);

interface CellDblclickEvent {
  row: FmsDigestApi.Digest;
}

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'vertical',
  schema: useDigestLibraryFormSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1',
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    cellDblclick: ({ row }: CellDblclickEvent) => selectDigest(row),
  },
  gridOptions: {
    columns: useDigestLibraryGridColumns(),
    height: 360,
    pagerConfig: { enabled: false },
    proxyConfig: {
      ajax: {
        query: async () => {
          if (!accountSetId.value) {
            return { list: [], total: 0 };
          }
          const list = await getDigestSimpleList(accountSetId.value);
          return { list, total: list.length };
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      enabled: false,
    },
  } as VxeTableGridOptions<FmsDigestApi.Digest>,
});

const [Modal, modalApi] = useVbenModal({
  showCancelButton: false,
  showConfirmButton: false,
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) return;
    await nextTick();
    resetForm();
    gridApi.query();
  },
});

/** 打开凭证摘要库 */
function open(id: number) {
  accountSetId.value = id;
  modalApi.open();
}
defineExpose({ open });

/** 编辑常用摘要 */
async function editDigest(row: FmsDigestApi.Digest) {
  editingId.value = row.id;
  await formApi.setValues({ id: row.id, content: row.content });
}

/** 保存常用摘要 */
async function submitForm() {
  if (!accountSetId.value) return;
  const { valid } = await formApi.validate();
  if (!valid) return;
  formLoading.value = true;
  try {
    const values = await formApi.getValues();
    const data: FmsDigestApi.Digest = {
      id: editingId.value,
      accountSetId: accountSetId.value,
      content: values.content,
    };
    await (editingId.value ? updateDigest(data) : createDigest(data));
    message.success($t('ui.actionMessage.operationSuccess'));
    resetForm();
    gridApi.query();
  } finally {
    formLoading.value = false;
  }
}

/** 删除常用摘要 */
async function handleDelete(row: FmsDigestApi.Digest) {
  if (!accountSetId.value) return;
  try {
    // 删除的二次确认
    await confirm(`是否确认删除常用摘要“${row.content}”？`);
    await deleteDigest(accountSetId.value, row.id!);
    message.success($t('ui.actionMessage.deleteSuccess'));
    gridApi.query();
  } catch {}
}

/** 套用常用摘要 */
function selectDigest(row: FmsDigestApi.Digest) {
  emit('select', row.content);
  modalApi.close();
}

/** 重置表单 */
function resetForm() {
  editingId.value = undefined;
  formApi.setValues({ id: undefined, content: '' });
}
</script>

<template>
  <Modal title="凭证摘要库" class="w-[620px]">
    <div class="mx-4">
      <Form />
      <div class="mb-4 flex justify-end gap-2">
        <Button
          v-if="fmsStore.isAccountSetWritable && canSubmit"
          type="primary"
          :loading="formLoading"
          @click="submitForm"
        >
          {{ editingId ? '保存' : '新增' }}
        </Button>
        <Button @click="resetForm">取消</Button>
      </div>
      <Grid>
        <template #actions="{ row }">
          <TableAction
            :actions="[
              {
                label: '编辑',
                type: 'link',
                icon: ACTION_ICON.EDIT,
                auth: ['fms:config:digest:update'],
                ifShow: fmsStore.isAccountSetWritable,
                onClick: editDigest.bind(null, row),
              },
              {
                label: '删除',
                type: 'link',
                danger: true,
                icon: ACTION_ICON.DELETE,
                auth: ['fms:config:digest:delete'],
                ifShow: fmsStore.isAccountSetWritable,
                onClick: handleDelete.bind(null, row),
              },
              {
                label: '套用',
                type: 'link',
                onClick: selectDigest.bind(null, row),
              },
            ]"
          />
        </template>
      </Grid>
      <div class="mt-2 text-xs text-gray-500">
        双击摘要可直接套用到当前分录
      </div>
    </div>
  </Modal>
</template>
