const record = require('node-record-lpcm16');
import { Buffer } from 'buffer';

const THRESHOLD = 20; // 無音と判定する音量レベルの閾値
const MUTE_DURATION = 3; // ミュートと判定する無音状態が続く秒数
const SAMPLE_RATE = 44100; // サンプリングレート
const BUFFER_SIZE = 4096; // チャンクのサイズ
const CHUNKS_PER_SECOND = SAMPLE_RATE / BUFFER_SIZE; // 1秒間に受け取るチャンクの数

// 無音状態が続いているチャンクの数
let silentChunks = 0;

// 録音データを受け取るインスタンス
const mic = record.record({
  sampleRate: SAMPLE_RATE,
  threshold: 0,
  verbose: false
});

// 録音データを受け取るストリーム
const micInputStream = mic.stream();

// 録音データを受け取る
micInputStream.on('data', (data: Buffer) => {
  // チャンクのデータをInt16Arrayに変換
  const intData = new Int16Array(data.buffer);

  // 音量レベルを計算
  const volumeLevel = intData.reduce((sum, value) => sum + Math.abs(value), 0) / intData.length;

  // 無音状態の判定
  // 音量レベルが閾値未満のときは無音と判定
  if (volumeLevel < THRESHOLD) {
    silentChunks += 1;
  } else {
    silentChunks = 0;
  }

  // ミュート状態の判定
  if (silentChunks > CHUNKS_PER_SECOND * MUTE_DURATION) {
    console.log('Muted');
    // ミュート状態が続いているときの処理
  }
});

// エラー処理
micInputStream.on('error', (err: Error) => {
  console.error('Error: ', err);
});

// ストリーム終了時の処理
mic.start();
console.log('Recording...');

// SIGINTシグナル（Ctrl+Cなど）を受け取ったときに録音を停止
process.on('SIGINT', () => {
  mic.stop();
  console.log('Stopping recording...');
});