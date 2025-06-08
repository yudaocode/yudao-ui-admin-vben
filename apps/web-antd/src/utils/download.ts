/**
 * 下载工具模块
 * 提供多种文件格式的下载功能
 */
// TODO @ziye：请使用 @vben/utils/download 代替 packages/@core/base/shared/src/utils/download.ts

/**
 * 图片下载配置接口
 */
interface ImageDownloadOptions {
  /** 图片 URL */
  url: string;
  /** 指定画布宽度 */
  canvasWidth?: number;
  /** 指定画布高度 */
  canvasHeight?: number;
  /** 将图片绘制在画布上时带上图片的宽高值，默认为 true */
  drawWithImageSize?: boolean;
}

/**
 * 基础文件下载函数
 * @param data - 文件数据 Blob
 * @param fileName - 文件名
 * @param mimeType - MIME 类型
 */
export const download0 = (data: Blob, fileName: string, mimeType: string) => {
  try {
    // 创建 blob
    const blob = new Blob([data], { type: mimeType });
    // 创建 href 超链接，点击进行下载
    window.URL = window.URL || window.webkitURL;
    const href = URL.createObjectURL(blob);
    const downA = document.createElement('a');
    downA.href = href;
    downA.download = fileName;
    downA.click();
    // 销毁超链接
    window.URL.revokeObjectURL(href);
  } catch (error) {
    console.error('文件下载失败:', error);
    throw new Error(
      `文件下载失败: ${error instanceof Error ? error.message : '未知错误'}`,
    );
  }
};

/**
 * 触发文件下载的通用方法
 * @param url - 下载链接
 * @param fileName - 文件名
 */
const triggerDownload = (url: string, fileName: string) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
};

export const download = {
  /**
   * 下载 Excel 文件
   * @param data - 文件数据 Blob
   * @param fileName - 文件名
   */
  excel: (data: Blob, fileName: string) => {
    download0(data, fileName, 'application/vnd.ms-excel');
  },

  /**
   * 下载 Word 文件
   * @param data - 文件数据 Blob
   * @param fileName - 文件名
   */
  word: (data: Blob, fileName: string) => {
    download0(data, fileName, 'application/msword');
  },

  /**
   * 下载 Zip 文件
   * @param data - 文件数据 Blob
   * @param fileName - 文件名
   */
  zip: (data: Blob, fileName: string) => {
    download0(data, fileName, 'application/zip');
  },

  /**
   * 下载 HTML 文件
   * @param data - 文件数据 Blob
   * @param fileName - 文件名
   */
  html: (data: Blob, fileName: string) => {
    download0(data, fileName, 'text/html');
  },

  /**
   * 下载 Markdown 文件
   * @param data - 文件数据 Blob
   * @param fileName - 文件名
   */
  markdown: (data: Blob, fileName: string) => {
    download0(data, fileName, 'text/markdown');
  },

  /**
   * 下载 JSON 文件
   * @param data - 文件数据 Blob
   * @param fileName - 文件名
   */
  json: (data: Blob, fileName: string) => {
    download0(data, fileName, 'application/json');
  },

  /**
   * 下载图片（允许跨域）
   * @param options - 图片下载配置
   */
  image: (options: ImageDownloadOptions) => {
    const {
      url,
      canvasWidth,
      canvasHeight,
      drawWithImageSize = true,
    } = options;

    const image = new Image();
    // image.setAttribute('crossOrigin', 'anonymous')
    image.src = url;
    image.addEventListener('load', () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth || image.width;
        canvas.height = canvasHeight || image.height;
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
        ctx?.clearRect(0, 0, canvas.width, canvas.height);

        if (drawWithImageSize) {
          ctx.drawImage(image, 0, 0, image.width, image.height);
        } else {
          ctx.drawImage(image, 0, 0);
        }

        const dataUrl = canvas.toDataURL('image/png');
        triggerDownload(dataUrl, 'image.png');
      } catch (error) {
        console.error('图片下载失败:', error);
        throw new Error(
          `图片下载失败: ${error instanceof Error ? error.message : '未知错误'}`,
        );
      }
    });

    image.addEventListener('error', () => {
      throw new Error('图片加载失败');
    });
  },

  /**
   * 将 Base64 字符串转换为文件对象
   * @param base64 - Base64 字符串
   * @param fileName - 文件名
   * @returns File 对象
   */
  base64ToFile: (base64: string, fileName: string): File => {
    // 输入验证
    if (!base64 || typeof base64 !== 'string') {
      throw new Error('base64 参数必须是非空字符串');
    }

    // 将 base64 按照逗号进行分割，将前缀与后续内容分隔开
    const data = base64.split(',');
    if (data.length !== 2 || !data[0] || !data[1]) {
      throw new Error('无效的 base64 格式');
    }

    // 利用正则表达式从前缀中获取类型信息（image/png、image/jpeg、image/webp等）
    const typeMatch = data[0].match(/:(.*?);/);
    if (!typeMatch || !typeMatch[1]) {
      throw new Error('无法解析 base64 类型信息');
    }
    const type = typeMatch[1];

    // 从类型信息中获取具体的文件格式后缀（png、jpeg、webp）
    const typeParts = type.split('/');
    if (typeParts.length !== 2 || !typeParts[1]) {
      throw new Error('无效的 MIME 类型格式');
    }
    const suffix = typeParts[1];

    try {
      // 使用 atob() 对 base64 数据进行解码，结果是一个文件数据流以字符串的格式输出
      const bstr = window.atob(data[1]);

      // 获取解码结果字符串的长度
      const n = bstr.length;
      // 根据解码结果字符串的长度创建一个等长的整型数字数组
      const u8arr = new Uint8Array(n);

      // 优化的 Uint8Array 填充逻辑
      for (let i = 0; i < n; i++) {
        // 使用 charCodeAt() 获取字符对应的字节值（Base64 解码后的字符串是字节级别的）
        // eslint-disable-next-line unicorn/prefer-code-point
        u8arr[i] = bstr.charCodeAt(i);
      }

      // 返回 File 文件对象
      return new File([u8arr], `${fileName}.${suffix}`, { type });
    } catch (error) {
      throw new Error(
        `Base64 解码失败: ${error instanceof Error ? error.message : '未知错误'}`,
      );
    }
  },
};
