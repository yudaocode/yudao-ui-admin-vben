<template>
  <BasicModal v-bind="$attrs" @register="registerModal" title="缓存模块">
    <List :data-source="listData">
      <template #renderItem="{ item }">
        <ListItem>
          <ListItemMeta>
            <template #title>
              <a @click="handleKeyValue(item)">{{ item }}</a>
            </template>
            <template #actions>
              <a @click="handleDeleteKey(item)">删除</a>
            </template>
          </ListItemMeta>
        </ListItem>
      </template>
    </List>
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>
<script lang="ts" setup name="RedisModal">
import { ref } from 'vue'
import { List } from 'ant-design-vue'
import { BasicForm, useForm } from '@/components/Form'
import { BasicModal, useModalInner } from '@/components/Modal'
import { formSchema } from '../redis.data'
import { deleteKey, getKeyList } from '@/api/infra/redis'

const ListItem = List.Item
const ListItemMeta = List.Item.Meta

const listData = ref<any[]>([])

const [registerForm, { setFieldsValue, resetFields }] = useForm({
  labelWidth: 120,
  baseColProps: { span: 24 },
  schemas: formSchema,
  showActionButtonGroup: false,
  actionColOptions: { span: 23 }
})

const [registerModal, { setModalProps }] = useModalInner(async (data) => {
  resetFields()
  setModalProps({ confirmLoading: false })
  console.info(data.record)
  const res = await getKeyList(data.record)
  listData.value = res
})

async function handleKeyValue(item) {
  const res = await getKeyList(item)
  setFieldsValue({ ...res })
}

function handleDeleteKey(item) {
  deleteKey(item)
}
</script>
