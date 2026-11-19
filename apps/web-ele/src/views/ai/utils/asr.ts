/**
 * AI 语音识别的音频处理：录音、上传的音频都在浏览器解码，
 * 重采样为 16 kHz 单声道 16 位 PCM WAV 再提交，各平台统一按这个格式识别
 */

const SAMPLE_RATE = 16_000; // 采样率

/** 各平台的最长音频时长（秒）：按官方上限；阿里云受 Base64 后 10 MB 限制，取 180 秒 */
export const ASR_PLATFORM_MAX_SECONDS: Record<string, number> = {
  DEEPSEEK: 120,
  ALIBABA: 180,
  TENCENT: 60,
  BAIDU: 60,
};

/** 获得平台的最长音频时长（秒），未知平台按 60 秒 */
export function getAsrMaxSeconds(platform?: string): number {
  return (platform && ASR_PLATFORM_MAX_SECONDS[platform]) || 60;
}

export interface WavRecorder {
  stop: () => Promise<Blob>; // 停止录音，返回 WAV
  cancel: () => void; // 放弃录音
}

/**
 * 开始录音：需要麦克风权限
 *
 * @param maxSeconds 最长时长（秒），由调用方到时自动停止；超出的部分会被截断
 */
export async function startWavRecorder(
  maxSeconds: number,
): Promise<WavRecorder> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const release = () => {
    for (const track of stream.getTracks()) {
      track.stop();
    }
  };
  let recorder: MediaRecorder;
  const chunks: Blob[] = [];
  try {
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    recorder.start();
  } catch (error) {
    release();
    throw error;
  }
  return {
    stop: () =>
      new Promise<Blob>((resolve, reject) => {
        recorder.onstop = () => {
          release();
          convertToWav(
            new Blob(chunks, { type: recorder.mimeType }),
            maxSeconds,
            true,
          ).then(resolve, reject);
        };
        recorder.stop();
      }),
    cancel: () => {
      recorder.onstop = null;
      if (recorder.state !== 'inactive') {
        recorder.stop();
      }
      release();
    },
  };
}

/**
 * 解码音频，重采样为 16 kHz 单声道，再编码为 WAV
 *
 * @param blob 浏览器能解码的音频，例如录音、mp3、wav、m4a
 * @param maxSeconds 最长时长（秒）
 * @param truncate 超出时是否截断：录音截断；上传的文件直接报错，避免识别结果不完整
 */
export async function convertToWav(
  blob: Blob,
  maxSeconds: number,
  truncate = false,
): Promise<Blob> {
  const context = new AudioContext();
  try {
    let decoded: AudioBuffer;
    try {
      decoded = await context.decodeAudioData(await blob.arrayBuffer());
    } catch {
      throw new Error('音频无法解析，请上传 mp3、wav、m4a 等常见格式');
    }
    if (!truncate && decoded.duration > maxSeconds) {
      const seconds = Math.ceil(decoded.duration);
      throw new Error(
        `音频时长 ${seconds} 秒，超过当前模型的 ${maxSeconds} 秒上限`,
      );
    }
    const length = Math.min(
      Math.max(1, Math.ceil(decoded.duration * SAMPLE_RATE)),
      maxSeconds * SAMPLE_RATE,
    );
    const offline = new OfflineAudioContext(1, length, SAMPLE_RATE);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const rendered = await offline.startRendering();
    return encodeWav(rendered.getChannelData(0));
  } finally {
    // 关闭失败不影响转换结果
    context.close().catch(() => {});
  }
}

/** 编码为 16 位 PCM WAV：44 字节文件头 + 采样数据（小端） */
function encodeWav(samples: Float32Array): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) {
      view.setUint8(offset + i, value.codePointAt(i)!);
    }
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // fmt 块大小
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // 单声道
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true); // 每秒字节数
  view.setUint16(32, 2, true); // 每个采样的字节数
  view.setUint16(34, 16, true); // 位深
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  for (const [i, element] of samples.entries()) {
    const sample = Math.max(-1, Math.min(1, element));
    view.setInt16(
      44 + i * 2,
      sample < 0 ? sample * 32_768 : sample * 32_767, // 16 位有符号整数范围
      true,
    );
  }
  return new Blob([buffer], { type: 'audio/wav' });
}
