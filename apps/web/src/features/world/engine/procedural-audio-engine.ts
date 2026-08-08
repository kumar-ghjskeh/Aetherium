import type { WorldAudioCue, WorldAudioMix, WorldAudioZone } from "./audio-system";
import { resolveWorldAudioProfile } from "./audio-system";

export interface WorldAudioEngine {
  applyMix: (mix: WorldAudioMix) => void;
  playCue: (cue: WorldAudioCue) => void;
  setListener: (position: readonly [number, number, number], facingRadians: number) => void;
  setPaused: (paused: boolean) => void;
  setZone: (zone: WorldAudioZone | null) => void;
  start: () => Promise<void>;
  stop: () => void;
}

const CUE_FREQUENCIES: Record<WorldAudioCue, number> = {
  achievement: 659.25,
  footstep: 82.41,
  interface: 392,
  interaction: 523.25,
  mentor: 440,
  travel: 293.66
};

export class ProceduralWorldAudioEngine implements WorldAudioEngine {
  private ambientFilter: BiquadFilterNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientPanner: PannerNode | null = null;
  private ambientSource: AudioBufferSourceNode | null = null;
  private context: AudioContext | null = null;
  private effectsGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicOscillators: OscillatorNode[] = [];

  async start(): Promise<void> {
    if (this.context) {
      await this.context.resume();
      return;
    }
    if (typeof AudioContext === "undefined") {
      throw new Error("This browser does not expose the Web Audio API.");
    }

    const context = new AudioContext();
    const masterGain = context.createGain();
    const ambientGain = context.createGain();
    const musicGain = context.createGain();
    const effectsGain = context.createGain();
    const ambientFilter = context.createBiquadFilter();
    const ambientPanner = context.createPanner();

    masterGain.gain.value = 0;
    ambientGain.gain.value = 0;
    musicGain.gain.value = 0;
    effectsGain.gain.value = 0;
    ambientFilter.type = "lowpass";
    ambientFilter.frequency.value = 680;
    ambientPanner.panningModel = "HRTF";
    ambientPanner.distanceModel = "inverse";
    ambientPanner.refDistance = 42;
    ambientPanner.maxDistance = 520;
    ambientPanner.rolloffFactor = 0.55;

    ambientGain.connect(masterGain);
    musicGain.connect(masterGain);
    effectsGain.connect(masterGain);
    masterGain.connect(context.destination);

    const noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const channel = noiseBuffer.getChannelData(0);
    let seed = 80421;
    for (let index = 0; index < channel.length; index += 1) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      channel[index] = (seed / 4294967296) * 2 - 1;
    }
    const ambientSource = context.createBufferSource();
    ambientSource.buffer = noiseBuffer;
    ambientSource.loop = true;
    ambientSource.connect(ambientFilter);
    ambientFilter.connect(ambientPanner);
    ambientPanner.connect(ambientGain);
    ambientSource.start();

    const musicOscillators = [1, 1.5].map((ratio, index) => {
      const oscillator = context.createOscillator();
      const harmonicGain = context.createGain();
      oscillator.type = index === 0 ? "sine" : "triangle";
      oscillator.frequency.value = 116.54 * ratio;
      harmonicGain.gain.value = index === 0 ? 0.06 : 0.018;
      oscillator.connect(harmonicGain);
      harmonicGain.connect(musicGain);
      oscillator.start();
      return oscillator;
    });

    this.context = context;
    this.masterGain = masterGain;
    this.ambientGain = ambientGain;
    this.musicGain = musicGain;
    this.effectsGain = effectsGain;
    this.ambientFilter = ambientFilter;
    this.ambientPanner = ambientPanner;
    this.ambientSource = ambientSource;
    this.musicOscillators = musicOscillators;
    await context.resume();
  }

  applyMix(mix: WorldAudioMix): void {
    const context = this.context;
    if (!context) {
      return;
    }
    this.setGain(this.masterGain, mix.masterGain, context.currentTime);
    this.setGain(this.ambientGain, mix.ambientGain * 0.2, context.currentTime);
    this.setGain(this.musicGain, mix.musicGain * 0.24, context.currentTime);
    this.setGain(this.effectsGain, mix.effectsGain * 0.28, context.currentTime);
  }

  setZone(zone: WorldAudioZone | null): void {
    const context = this.context;
    if (!context) {
      return;
    }
    const profile = resolveWorldAudioProfile(zone?.id ?? null);
    this.ambientFilter?.frequency.setTargetAtTime(
      profile.ambientFilterHz,
      context.currentTime,
      0.8
    );
    this.musicOscillators.forEach((oscillator, index) => {
      oscillator.frequency.setTargetAtTime(
        profile.musicFrequencyHz * (index === 0 ? 1 : 1.5),
        context.currentTime,
        1.2
      );
    });
    if (zone && this.ambientPanner) {
      this.ambientPanner.positionX.value = zone.center[0];
      this.ambientPanner.positionY.value = zone.center[1];
      this.ambientPanner.positionZ.value = zone.center[2];
    }
  }

  setListener(position: readonly [number, number, number], facingRadians: number): void {
    const listener = this.context?.listener;
    if (!listener) {
      return;
    }
    listener.positionX.value = position[0];
    listener.positionY.value = position[1];
    listener.positionZ.value = position[2];
    listener.forwardX.value = Math.sin(facingRadians);
    listener.forwardY.value = 0;
    listener.forwardZ.value = -Math.cos(facingRadians);
    listener.upX.value = 0;
    listener.upY.value = 1;
    listener.upZ.value = 0;
  }

  playCue(cue: WorldAudioCue): void {
    const context = this.context;
    const effectsGain = this.effectsGain;
    if (!context || !effectsGain || context.state !== "running") {
      return;
    }
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const duration = cue === "footstep" ? 0.06 : cue === "achievement" ? 0.34 : 0.16;
    oscillator.type = cue === "footstep" ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(CUE_FREQUENCIES[cue], context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(40, CUE_FREQUENCIES[cue] * 0.72),
      context.currentTime + duration
    );
    envelope.gain.setValueAtTime(cue === "footstep" ? 0.08 : 0.13, context.currentTime);
    envelope.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.connect(envelope);
    envelope.connect(effectsGain);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }

  setPaused(paused: boolean): void {
    const context = this.context;
    if (!context) {
      return;
    }
    void (paused ? context.suspend() : context.resume());
  }

  stop(): void {
    this.ambientSource?.stop();
    this.musicOscillators.forEach((oscillator) => oscillator.stop());
    if (this.context) {
      void this.context.close();
    }
    this.context = null;
    this.ambientSource = null;
    this.musicOscillators = [];
  }

  private setGain(node: GainNode | null, value: number, time: number): void {
    node?.gain.setTargetAtTime(value, time, 0.08);
  }
}
