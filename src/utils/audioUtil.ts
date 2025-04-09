const pcmToAudioBuffer = async (
  pcmData: ArrayBuffer,
  sampleRate: number,
  numChannels: number,
) => {
  const audioContext = new window.AudioContext();
  const audioBuffer = audioContext.createBuffer(
    numChannels,
    pcmData.byteLength / (2 * numChannels),
    sampleRate,
  );

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    const view = new DataView(pcmData);
    for (let i = 0; i < channelData.length; i++) {
      const offset = (i * numChannels + channel) * 2;
      const sample = view.getInt16(offset, true);
      channelData[i] = sample / 32768.0; // 16-bit PCM to float
    }
  }

  return audioBuffer;
};

const audioBufferToWav = (audioBuffer: AudioBuffer) => {
  const numOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const bufferLength = audioBuffer.length;
  const wavData = new DataView(
    new ArrayBuffer(44 + bufferLength * numOfChannels * 2),
  );

  const writeHeader = (
    view: DataView,
    bufferLength: number,
    numOfChannels: number,
    sampleRate: number,
  ) => {
    const RIFF = "RIFF".split("").map((c) => c.charCodeAt(0));
    const WAVE = "WAVE".split("").map((c) => c.charCodeAt(0));
    const fmt = "fmt ".split("").map((c) => c.charCodeAt(0));
    const data = "data".split("").map((c) => c.charCodeAt(0));

    const subChunk1Size = 16;
    const audioFormat = 1; // PCM
    const byteRate = sampleRate * numOfChannels * 2;
    const blockAlign = numOfChannels * 2;
    const bitsPerSample = 16;

    // RIFF
    view.setUint8(0, RIFF[0]);
    view.setUint8(1, RIFF[1]);
    view.setUint8(2, RIFF[2]);
    view.setUint8(3, RIFF[3]);
    view.setUint32(4, 36 + bufferLength * numOfChannels * 2, true); // Chunk size
    view.setUint8(8, WAVE[0]);
    view.setUint8(9, WAVE[1]);
    view.setUint8(10, WAVE[2]);
    view.setUint8(11, WAVE[3]);

    // fmt
    view.setUint8(12, fmt[0]);
    view.setUint8(13, fmt[1]);
    view.setUint8(14, fmt[2]);
    view.setUint8(15, fmt[3]);
    view.setUint32(16, subChunk1Size, true);
    view.setUint16(20, audioFormat, true);
    view.setUint16(22, numOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data
    view.setUint8(36, data[0]);
    view.setUint8(37, data[1]);
    view.setUint8(38, data[2]);
    view.setUint8(39, data[3]);
    view.setUint32(40, bufferLength * numOfChannels * 2, true);
  };

  // Write the audio data to the WAV file
  const writeAudioData = (
    view: DataView,
    audioBuffer: AudioBuffer,
    numOfChannels: number,
  ) => {
    let offset = 44;
    for (let channel = 0; channel < numOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < audioBuffer.length; i++) {
        const sample = channelData[i] * 32767; // Convert to 16-bit PCM
        view.setInt16(offset, sample, true);
        offset += 2;
      }
    }
  };

  // Write header and audio data
  writeHeader(wavData, bufferLength, numOfChannels, sampleRate);
  writeAudioData(wavData, audioBuffer, numOfChannels);

  return new Blob([wavData.buffer], { type: "audio/wav" });
};

export { pcmToAudioBuffer, audioBufferToWav };
