import type { VbenFormSchema } from '#/adapter/form';

/** 修改歌曲（名称、封面）的表单 */
export function useEditFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      component: 'Input',
      fieldName: 'title',
      label: '歌曲名称',
      rules: 'required',
      componentProps: {
        placeholder: '请输入歌曲名称',
        maxlength: 100,
        showWordLimit: true,
        clearable: true,
      },
    },
    {
      component: 'ImageUpload',
      fieldName: 'coverUrl',
      label: '封面图片',
      rules: 'required',
      componentProps: {
        accept: ['jpg', 'jpeg', 'png'],
        helpText: '支持 png / jpg，上传至文件服务',
      },
    },
  ];
}
