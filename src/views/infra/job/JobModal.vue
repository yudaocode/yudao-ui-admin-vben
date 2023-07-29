<script lang="ts" setup>
import { ref, unref } from 'vue'
import { Steps } from 'ant-design-vue'
import { descSchema, formSchema } from './job.data'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { BasicForm, useForm } from '@/components/Form'
import { BasicModal, useModalInner } from '@/components/Modal'
import { Description, useDescription } from '@/components/Description'
import { createJob, getJob, getJobNextTimes, updateJob } from '@/api/infra/job'
import { formatToDateTime } from '@/utils/dateUtil'

defineOptions({ name: 'InfraJobModal' })

const emit = defineEmits(['success', 'register'])

const Step = Steps.Step

const { t } = useI18n()
const { createMessage } = useMessage()
const isUpdate = ref(true)
const isEdit = ref(true)

const datas = ref()
const nextTimes = ref()

const [registerForm, { setFieldsValue, resetFields, validate }] = useForm({
  labelWidth: 120,
  baseColProps: { span: 24 },
  schemas: formSchema,
  showActionButtonGroup: false,
  actionColOptions: { span: 23 },
})

const [registerDesc] = useDescription({
  schema: descSchema,
  data: datas,
})

const [registerModal, { setModalProps, closeModal }] = useModalInner(async (data) => {
  isEdit.value = !!data?.isEdit
  setModalProps({ confirmLoading: false })
  if (data?.isEdit) {
    resetFields()

    isUpdate.value = !!data?.isUpdate
    if (unref(isUpdate)) {
      const res = await getJob(data.record.id)
      setFieldsValue({ ...res })
    }
  }
  else {
    datas.value = await getJob(data.record.id)
    nextTimes.value = await getJobNextTimes(data.record.id)
  }
})

async function handleSubmit() {
  try {
    const values = await validate()
    setModalProps({ confirmLoading: true })
    if (unref(isUpdate))
      await updateJob(values)
    else
      await createJob(values)

    closeModal()
    emit('success')
    createMessage.success(t('common.saveSuccessText'))
  }
  finally {
    setModalProps({ confirmLoading: false })
  }
}
</script>

<template>
  <BasicModal
    v-bind="$attrs"
    :title="isEdit ? (isUpdate ? t('action.edit') : t('action.create')) : t('action.detail')"
    @register="registerModal"
    @ok="handleSubmit"
  >
    <BasicForm v-if="isEdit" @register="registerForm" />
    <Description v-if="!isEdit" :column="2" @register="registerDesc" />
    <Steps v-if="!isEdit" progress-dot :current="nextTimes && nextTimes.length" direction="vertical">
      <template v-for="(nextTime, index) in nextTimes" :key="index">
        <Step :title="formatToDateTime(nextTime)" :description="'第' + `${index + 1}` + '次'" />
      </template>
    </Steps>
  </BasicModal>
</template>
