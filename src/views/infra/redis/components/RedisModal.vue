<script lang="ts" setup>
import { ref } from 'vue'
import { List } from 'ant-design-vue'
import { formSchema } from '../redis.data'
import { useI18n } from '@/hooks/web/useI18n'
import { BasicForm, useForm } from '@/components/Form'
import { BasicModal, useModalInner } from '@/components/Modal'
import { deleteKey, getKeyList } from '@/api/infra/redis'

defineOptions({ name: 'RedisModal' })

const { t } = useI18n()
const listData = ref<any[]>([])

const [registerForm, { setFieldsValue, resetFields }] = useForm({
  labelWidth: 120,
  baseColProps: { span: 24 },
  schemas: formSchema,
  showActionButtonGroup: false,
  actionColOptions: { span: 23 },
})

const [registerModal, { setModalProps }] = useModalInner(async (data) => {
  resetFields()
  setModalProps({ confirmLoading: false })
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

<template>
  <BasicModal v-bind="$attrs" title="缓存模块" @register="registerModal">
    <List :data-source="listData">
      <template #renderItem="{ item }">
        <List.Item>
          <template #actions>
            <a @click="handleDeleteKey(item)">{{ t('action.delete') }}</a>
          </template>
          <List.Item.Meta>
            <template #title>
              <a @click="handleKeyValue(item)">{{ item }}</a>
            </template>
          </List.Item.Meta>
        </List.Item>
      </template>
    </List>
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>
