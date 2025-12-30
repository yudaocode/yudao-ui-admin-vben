<script setup lang="ts">
import type { Recordable } from '@vben/types';

import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import {
  updateUserPassword,
  updateUserPassword1,
} from '#/api/system/user/profile';

const props = defineProps<{
  isAutoCreate: 0 | number;
}>();
const emit = defineEmits<{
  (e: 'success'): void;
}>();

const [Form, formApi] = useVbenForm({
  commonConfig: {
    labelWidth: 70,
  },
  schema: [
    {
      component: 'InputPassword',
      fieldName: 'oldPassword',
      label: '旧密码',
      dependencies: {
        triggerFields: [''],
        if: props.isAutoCreate !== 1,
      },
      rules: z
        .string({ message: '请输入密码' })
        .min(5, '密码长度不能少于 5 个字符')
        .max(20, '密码长度不能超过 20 个字符'),
    },
    {
      component: 'InputPassword',
      dependencies: {
        rules(values) {
          return z
            .string({ message: '请输入新密码' })
            .min(5, '密码长度不能少于 5 个字符')
            .max(20, '密码长度不能超过 20 个字符')
            .refine(
              (value) => value !== values.oldPassword,
              '新旧密码不能相同',
            );
        },
        triggerFields: ['newPassword', 'oldPassword'],
      },
      fieldName: 'newPassword',
      label: '新密码',
      rules: 'required',
    },
    {
      component: 'InputPassword',
      dependencies: {
        rules(values) {
          return z
            .string({ message: '请输入确认密码' })
            .min(5, '密码长度不能少于 5 个字符')
            .max(20, '密码长度不能超过 20 个字符')
            .refine(
              (value) => value === values.newPassword,
              '新密码和确认密码不一致',
            );
        },
        triggerFields: ['newPassword', 'confirmPassword'],
      },
      fieldName: 'confirmPassword',
      label: '确认密码',
      rules: 'required',
    },
  ],
  resetButtonOptions: {
    show: false,
  },
  submitButtonOptions: {
    content: '修改密码',
  },
  handleSubmit,
});

async function handleSubmit(values: Recordable<any>) {
  try {
    formApi.setLoading(true);
    // 提交表单
    // eslint-disable-next-line unicorn/prefer-ternary
    if (props.isAutoCreate === 1) {
      // 通过第三方登陆自动创建的，首次不需要校验旧密码
      await updateUserPassword1({
        newPassword: values.newPassword,
      });
    } else {
      await updateUserPassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
    }
    emit('success');
    message.success($t('ui.actionMessage.operationSuccess'));
  } catch (error) {
    console.error(error);
  } finally {
    formApi.setLoading(false);
  }
}
</script>

<template>
  <div class="mt-4 md:w-full lg:w-1/2 2xl:w-2/5">
    <Form />
  </div>
</template>
