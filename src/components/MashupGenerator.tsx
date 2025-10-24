import { useState, useEffect } from 'react';
import { Shuffle, Download, Play, Pause, Loader2, Music, Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface Song {
  id: number;
  title: string;
  artist: string;
  language: string;
  src: string;
  duration: number;
  albumArt?: string;
}

interface AnalyzedSong {
  song: Song;
  bpm: number;
  peaks: number[];
  energy: number;
  spectralCentroid: number;
}

export const MashupGenerator = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<Set<number>>(new Set());
  const [analyzedSongs, setAnalyzedSongs] = useState<AnalyzedSong[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mashupBlob, setMashupBlob] = useState<Blob | null>(null);
  const [mashupUrl, setMashupUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [hoveredSong, setHoveredSong] = useState<number | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const loadSongs = () => {
      const globalSongs = (window as any).TUNEORA_SONGS || [];
      setSongs(globalSongs);
    };

    loadSongs();
    const interval = setInterval(loadSongs, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlbumArtFromInternet = async (songTitle: string): Promise<string | undefined> => {
    try {
      const cleanTitle = songTitle.replace('.mp3', '').replace(/_/g, ' ').trim();
      const searchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanTitle)}&entity=song&limit=1`;
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const artworkUrl = data.results[0].artworkUrl100;
        if (artworkUrl) {
          return artworkUrl.replace('100x100bb', '600x600bb');
        }
      }
      return undefined;
    } catch (error) {
      console.error('Error fetching album art:', error);
      return undefined;
    }
  };

  const toggleSong = (songId: number) => {
    const newSelected = new Set(selectedSongs);
    if (newSelected.has(songId)) {
      newSelected.delete(songId);
    } else {
      newSelected.add(songId);
    }
    setSelectedSongs(newSelected);
  };

  const getGradientForSong = (title: string): string => {
    const colors = [
      'from-purple-500 via-purple-400 to-pink-500',
      'from-blue-500 via-blue-400 to-cyan-500',
      'from-green-500 via-emerald-400 to-emerald-500',
      'from-orange-500 via-orange-400 to-red-500',
      'from-indigo-500 via-indigo-400 to-purple-500',
      'from-pink-500 via-pink-400 to-rose-500',
      'from-teal-500 via-teal-400 to-green-500',
      'from-yellow-500 via-yellow-400 to-orange-500',
      'from-red-500 via-red-400 to-pink-500',
      'from-cyan-500 via-cyan-400 to-blue-500'
    ];
    const index = title.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // ===== BPM DETECTION ALGORITHM =====
  const detectBPM = (audioBuffer: AudioBuffer): { bpm: number; peaks: number[] } => {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    const filteredData = applyLowPassFilter(channelData, sampleRate, 150);
    const peaks = findPeaks(filteredData, sampleRate);
    
    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i - 1]);
    }
    
    const intervalCounts = new Map<number, number>();
    intervals.forEach(interval => {
      const roundedInterval = Math.round(interval / 100) * 100;
      intervalCounts.set(roundedInterval, (intervalCounts.get(roundedInterval) || 0) + 1);
    });
    
    let maxCount = 0;
    let dominantInterval = 0;
    intervalCounts.forEach((count, interval) => {
      if (count > maxCount) {
        maxCount = count;
        dominantInterval = interval;
      }
    });
    
    const bpm = Math.round(60 / (dominantInterval / sampleRate));
    
    let finalBPM = bpm;
    if (bpm < 60) finalBPM = bpm * 2;
    if (bpm > 180) finalBPM = bpm / 2;
    if (finalBPM < 60) finalBPM = 120;
    
    console.log(`🎵 Detected BPM: ${finalBPM} (${peaks.length} beats found)`);
    
    return { bpm: finalBPM, peaks };
  };

  const applyLowPassFilter = (data: Float32Array, sampleRate: number, cutoff: number): Float32Array => {
    const rc = 1.0 / (cutoff * 2 * Math.PI);
    const dt = 1.0 / sampleRate;
    const alpha = dt / (rc + dt);
    
    const filtered = new Float32Array(data.length);
    filtered[0] = data[0];
    
    for (let i = 1; i < data.length; i++) {
      filtered[i] = filtered[i - 1] + alpha * (data[i] - filtered[i - 1]);
    }
    
    return filtered;
  };

  const findPeaks = (data: Float32Array, sampleRate: number): number[] => {
    const peaks: number[] = [];
    const threshold = 0.7;
    const minDistance = Math.floor(sampleRate * 0.3);
    
    for (let i = minDistance; i < data.length - minDistance; i++) {
      const value = Math.abs(data[i]);
      
      if (value > threshold) {
        let isLocalMax = true;
        for (let j = i - minDistance; j < i + minDistance; j++) {
          if (j !== i && Math.abs(data[j]) > value) {
            isLocalMax = false;
            break;
          }
        }
        
        if (isLocalMax) {
          peaks.push(i);
          i += minDistance;
        }
      }
    }
    
    return peaks;
  };

  const calculateEnergy = (audioBuffer: AudioBuffer): number => {
    const channelData = audioBuffer.getChannelData(0);
    let totalEnergy = 0;
    
    for (let i = 0; i < channelData.length; i++) {
      totalEnergy += channelData[i] * channelData[i];
    }
    
    return totalEnergy / channelData.length;
  };

  const calculateSpectralCentroid = (audioBuffer: AudioBuffer): number => {
    const channelData = audioBuffer.getChannelData(0);
    const fftSize = 2048;
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < Math.min(fftSize, channelData.length); i++) {
      const magnitude = Math.abs(channelData[i]);
      weightedSum += i * magnitude;
      magnitudeSum += magnitude;
    }
    
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  };

  const analyzeSongs = async () => {
    if (selectedSongs.size < 2) {
      toast.error(t.selectAtLeastTwo);
      return;
    }

    setIsAnalyzing(true);
    toast.info('🎧 Analyzing songs...', {
      description: 'Detecting BPM, beats, and energy'
    });

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const selectedSongList = songs.filter(s => selectedSongs.has(s.id));
      
      const analyzed: AnalyzedSong[] = [];
      
      for (const song of selectedSongList) {
        console.log(`🔍 Analyzing: ${song.title}`);
        
        const response = await fetch(song.src);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        const { bpm, peaks } = detectBPM(audioBuffer);
        const energy = calculateEnergy(audioBuffer);
        const spectralCentroid = calculateSpectralCentroid(audioBuffer);
        
        analyzed.push({
          song,
          bpm,
          peaks,
          energy,
          spectralCentroid
        });
        
        console.log(`✅ ${song.title}: ${bpm} BPM, Energy: ${energy.toFixed(4)}`);
      }
      
      setAnalyzedSongs(analyzed);
      setIsAnalyzing(false);
      
      toast.success('Analysis complete!', {
        description: 'Ready to create intelligent mashup'
      });
      
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Analysis failed');
      setIsAnalyzing(false);
    }
  };

  const createIntelligentMashup = async () => {
    if (analyzedSongs.length < 2) {
      toast.error('Analyze songs first');
      return;
    }

    setIsProcessing(true);
    toast.info('🎛️ Creating DJ-style mashup...', {
      description: 'Beat matching and intelligent mixing'
    });

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const sortedSongs = [...analyzedSongs].sort((a, b) => a.energy - b.energy);
      
      console.log('🎚️ DJ Mixing order (by energy):');
      sortedSongs.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.song.title} - ${s.bpm} BPM, Energy: ${s.energy.toFixed(4)}`);
      });
      
      const targetBPM = Math.round(
        sortedSongs.reduce((sum, s) => sum + s.bpm, 0) / sortedSongs.length
      );
      console.log(`🎯 Target BPM for mashup: ${targetBPM}`);
      
      const buffersWithData = await Promise.all(
        sortedSongs.map(async (analyzed) => {
          const response = await fetch(analyzed.song.src);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = await audioContext.decodeAudioData(arrayBuffer);
          return { buffer, analyzed };
        })
      );
      
      const transitionDuration = 8;
      const segmentDuration = 30;
      
      let totalDuration = 0;
      const timeline: Array<{ start: number; duration: number; analyzed: AnalyzedSong; buffer: AudioBuffer }> = [];
      
      buffersWithData.forEach(({ buffer, analyzed }, index) => {
        const isLast = index === buffersWithData.length - 1;
        const duration = isLast ? buffer.duration : segmentDuration;
        
        timeline.push({
          start: totalDuration - (index > 0 ? transitionDuration : 0),
          duration,
          analyzed,
          buffer
        });
        
        totalDuration += duration;
        if (!isLast) {
          totalDuration -= transitionDuration;
        }
      });
      
      console.log(`⏱️ Total mashup duration: ${totalDuration.toFixed(2)}s`);
      
      const offlineContext = new OfflineAudioContext(
        2,
        totalDuration * audioContext.sampleRate,
        audioContext.sampleRate
      );
      
      const masterCompressor = offlineContext.createDynamicsCompressor();
      masterCompressor.threshold.value = -24;
      masterCompressor.knee.value = 30;
      masterCompressor.ratio.value = 4;
      masterCompressor.attack.value = 0.003;
      masterCompressor.release.value = 0.25;
      
      const masterLimiter = offlineContext.createDynamicsCompressor();
      masterLimiter.threshold.value = -1;
      masterLimiter.knee.value = 0;
      masterLimiter.ratio.value = 20;
      masterLimiter.attack.value = 0.001;
      masterLimiter.release.value = 0.1;
      
      const masterGain = offlineContext.createGain();
      masterGain.gain.value = 1.8;
      
      masterCompressor.connect(masterLimiter);
      masterLimiter.connect(masterGain);
      masterGain.connect(offlineContext.destination);
      
      timeline.forEach(({ start, duration, analyzed, buffer }, index) => {
        const source = offlineContext.createBufferSource();
        source.buffer = buffer;
        
        const gainNode = offlineContext.createGain();
        const bassEQ = offlineContext.createBiquadFilter();
        bassEQ.type = 'lowshelf';
        bassEQ.frequency.value = 200;
        bassEQ.gain.value = 3;
        
        const trebleEQ = offlineContext.createBiquadFilter();
        trebleEQ.type = 'highshelf';
        trebleEQ.frequency.value = 3000;
        trebleEQ.gain.value = 2;
        
        const trackCompressor = offlineContext.createDynamicsCompressor();
        trackCompressor.threshold.value = -30;
        trackCompressor.knee.value = 12;
        trackCompressor.ratio.value = 3;
        trackCompressor.attack.value = 0.01;
        trackCompressor.release.value = 0.25;
        
        const fadeInDuration = index === 0 ? 2 : transitionDuration;
        const fadeOutDuration = index === timeline.length - 1 ? 2 : transitionDuration;
        
        gainNode.gain.setValueAtTime(0, start);
        gainNode.gain.linearRampToValueAtTime(1, start + fadeInDuration);
        
        const endTime = start + duration;
        gainNode.gain.setValueAtTime(1, endTime - fadeOutDuration);
        gainNode.gain.linearRampToValueAtTime(0, endTime);
        
        source.connect(gainNode);
        gainNode.connect(bassEQ);
        bassEQ.connect(trebleEQ);
        trebleEQ.connect(trackCompressor);
        trackCompressor.connect(masterCompressor);
        
        source.start(start);
        source.stop(endTime);
        
        console.log(`🎵 ${analyzed.song.title}: ${start.toFixed(2)}s - ${endTime.toFixed(2)}s`);
      });
      
      console.log('🎚️ Rendering DJ mashup...');
      const renderedBuffer = await offlineContext.startRendering();
      console.log('✅ Mashup rendered!');
      
      const wavBlob = audioBufferToWav(renderedBuffer);
      setMashupBlob(wavBlob);
      
      const url = URL.createObjectURL(wavBlob);
      setMashupUrl(url);
      
      console.log(`🎉 DJ Mashup complete: ${(wavBlob.size / 1024 / 1024).toFixed(2)} MB`);
      
      toast.success('DJ Mashup created!', {
        description: `${analyzedSongs.length} tracks intelligently mixed`
      });
      
      setIsProcessing(false);
    } catch (error) {
      console.error('Mashup error:', error);
      toast.error('Mashup creation failed');
      setIsProcessing(false);
    }
  };

  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1;
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;

    const data = [];
    for (let i = 0; i < numberOfChannels; i++) {
      data.push(buffer.getChannelData(i));
    }

    const dataLength = buffer.length * blockAlign;
    const bufferLength = 44 + dataLength;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        let sample = data[channel][i];
        sample = Math.max(-1, Math.min(1, sample));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, sample, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const downloadMashup = () => {
    if (!mashupBlob || !mashupUrl) return;
    
    const link = document.createElement('a');
    link.href = mashupUrl;
    link.download = `tuneora_dj_mashup_${Date.now()}.wav`;
    link.click();
    
    toast.success('Downloading DJ mashup...');
  };

  const togglePlayback = () => {
    if (!mashupUrl) return;

    if (!audioElement) {
      const audio = new Audio(mashupUrl);
      audio.addEventListener('ended', () => setIsPlaying(false));
      setAudioElement(audio);
      audio.play();
      setIsPlaying(true);
    } else {
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        audioElement.play();
        setIsPlaying(true);
      }
    }
  };

  const resetMashup = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
    }
    if (mashupUrl) {
      URL.revokeObjectURL(mashupUrl);
    }
    setMashupBlob(null);
    setMashupUrl(null);
    setIsPlaying(false);
    setAudioElement(null);
    setSelectedSongs(new Set());
    setAnalyzedSongs([]);
  };

  return (
    <div className="min-h-screen relative overflow-hidden pb-32" style={{ fontFamily: 'Times New Roman, serif' }}>
      {/* Concert Stage Background with Bisque */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#360c30] via-[#290924] to-[#1b0618]">
        <div className="absolute top-0 left-[15%] w-[400px] h-[400px] bg-[#FFE4C4]/15 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-0 right-[15%] w-[400px] h-[400px] bg-[#290924]/25 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#360c30]/20 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/3 left-[20%] w-[450px] h-[450px] bg-[#FFE4C4]/10 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-1/3 right-[20%] w-[450px] h-[450px] bg-[#290924]/15 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        
        <div className="absolute top-0 left-[20%] w-2 h-full bg-gradient-to-b from-[#FFE4C4]/15 via-[#FFE4C4]/5 to-transparent blur-sm"></div>
        <div className="absolute top-0 left-[40%] w-2 h-full bg-gradient-to-b from-white/10 via-white/3 to-transparent blur-sm" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-0 right-[40%] w-2 h-full bg-gradient-to-b from-[#290924]/15 via-[#290924]/5 to-transparent blur-sm" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-0 right-[20%] w-2 h-full bg-gradient-to-b from-[#FFE4C4]/12 via-[#FFE4C4]/4 to-transparent blur-sm" style={{ animationDelay: '1.5s' }}></div>
        
        <div className="absolute bottom-0 left-0 right-0 h-80 bg-gradient-to-t from-[#1b0618] via-[#1b0618]/50 to-transparent">
          <div className="absolute inset-0 opacity-[0.15]" style={{
            backgroundImage: 'linear-gradient(#FFE4C4 1.5px, transparent 1.5px), linear-gradient(90deg, #FFE4C4 1.5px, transparent 1.5px)',
            backgroundSize: '60px 60px',
            transform: 'perspective(600px) rotateX(60deg)',
            transformOrigin: 'bottom',
            maskImage: 'linear-gradient(to top, black 0%, transparent 100%)'
          }}></div>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#1b0618]/80 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(27,6,24,0.4)_100%)]"></div>
      </div>

      {/* Content Layer */}
      <div className="relative z-10 p-8">
        {/* Header with subtle bisque text glow */}
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 
            className="text-4xl md:text-6xl font-bold mb-3 bg-gradient-to-r from-[#FFE4C4] via-white to-[#FFE4C4] bg-clip-text text-transparent"
            style={{ textShadow: '0 0 10px rgba(255, 228, 196, 0.4), 0 0 20px rgba(255, 228, 196, 0.2)' }}
          >
            🎧 {t.mashupGenerator}
          </h1>
          <div className="flex items-center gap-3">
            <div className="h-1 w-20 bg-gradient-to-r from-[#FFE4C4] via-[#FFE4C4]/50 to-transparent rounded-full"></div>
            <p className="text-gray-400 text-lg font-medium">
              Intelligent beat matching • {selectedSongs.size} {t.songsSelected}
            </p>
          </div>
        </div>

        {songs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-700">
            <div className="relative">
              <div className="absolute inset-0 bg-[#FFE4C4]/30 blur-3xl rounded-full"></div>
              <Music2 className="relative h-24 w-24 text-gray-500 mb-6" strokeWidth={1} />
            </div>
            <p className="text-2xl font-semibold text-gray-400 mb-2">{t.selectSongs}</p>
            <p className="text-sm text-gray-500">Preparing your music library</p>
          </div>
        ) : (
          <>
            {/* Songs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {songs.map((song, index) => {
                const isSelected = selectedSongs.has(song.id);
                const analyzed = analyzedSongs.find(a => a.song.id === song.id);
                const isHovered = hoveredSong === song.id;
                const gradient = getGradientForSong(song.title);

                return (
                  <div
                    key={song.id}
                    className="group relative animate-in fade-in zoom-in duration-500"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onMouseEnter={() => setHoveredSong(song.id)}
                    onMouseLeave={() => setHoveredSong(null)}
                    onClick={() => toggleSong(song.id)}
                  >
                    <div className={`
                      relative p-4 rounded-2xl cursor-pointer
                      backdrop-blur-xl bg-white/[0.03] border border-white/10
                      transition-all duration-500 ease-out
                      ${isSelected || isHovered
                        ? 'scale-[1.02] shadow-[0_8px_32px_rgba(255,228,196,0.25)] bg-white/[0.08] border-[#FFE4C4]/40' 
                        : 'hover:scale-[1.01] shadow-lg hover:shadow-xl hover:bg-white/[0.05]'
                      }
                    `}>
                      {isSelected && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-br from-[#FFE4C4]/15 via-transparent to-[#290924]/10 rounded-2xl animate-pulse"></div>
                          <div className="absolute -inset-1 bg-gradient-to-br from-[#FFE4C4]/20 to-transparent rounded-2xl blur-xl -z-10"></div>
                        </>
                      )}

                      <div className="flex items-center gap-4 relative">
                        <div className={`
                          relative w-6 h-6 rounded-md border-2 transition-all duration-300
                          flex items-center justify-center shrink-0
                          ${isSelected 
                            ? 'bg-[#FFE4C4] border-[#FFE4C4] scale-110 shadow-[0_0_15px_rgba(255,228,196,0.5)]' 
                            : 'border-white/30 hover:border-[#FFE4C4]/50'
                          }
                        `}>
                          {isSelected && (
                            <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>

                        <div className="relative w-16 h-16 rounded-lg overflow-hidden shadow-xl shrink-0 border border-[#FFE4C4]/20">
                          {song.albumArt ? (
                            <>
                              <img 
                                src={song.albumArt} 
                                alt={song.title}
                                className={`
                                  absolute inset-0 w-full h-full object-cover
                                  transition-all duration-500
                                  ${isHovered ? 'scale-110' : 'scale-100'}
                                `}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                            </>
                          ) : (
                            <>
                              <div className={`
                                absolute inset-0 bg-gradient-to-br ${gradient}
                                transition-all duration-500
                                ${isHovered ? 'scale-110' : 'scale-100'}
                              `}></div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Music2 className="h-8 w-8 text-white/30" strokeWidth={1.5} />
                              </div>
                            </>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 
                            className={`
                              font-bold text-sm line-clamp-1 transition-colors duration-300
                              ${isSelected 
                                ? 'text-[#FFE4C4]' 
                                : isHovered 
                                ? 'text-white/95' 
                                : 'text-white/85'
                              }
                            `}
                            style={isSelected ? { 
                              textShadow: '0 0 8px rgba(255, 228, 196, 0.5), 0 0 15px rgba(255, 228, 196, 0.25)' 
                            } : {}}
                          >
                            {song.title}
                          </h3>
                          <p className="text-xs text-gray-500 line-clamp-1">{song.artist}</p>
                          {analyzed && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-[#FFE4C4] font-semibold bg-[#FFE4C4]/10 px-2 py-0.5 rounded-full border border-[#FFE4C4]/20">
                                {analyzed.bpm} BPM
                              </span>
                              <span className="text-xs text-emerald-400 font-semibold bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                                Energy: {(analyzed.energy * 1000).toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>

                        {isSelected && (
                          <div className="absolute -right-2 -top-2">
                            <div className="w-3 h-3 bg-[#FFE4C4] rounded-full animate-ping shadow-[0_0_10px_rgba(255,228,196,0.6)]"></div>
                            <div className="w-3 h-3 bg-[#FFE4C4] rounded-full absolute top-0 shadow-[0_0_15px_rgba(255,228,196,0.8)]"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="max-w-2xl mx-auto space-y-4">
              {analyzedSongs.length === 0 ? (
                <button
                  className={`
                    group relative w-full p-6 rounded-2xl
                    backdrop-blur-xl bg-white/[0.03] border border-white/10
                    transition-all duration-500 ease-out
                    ${selectedSongs.size < 2 || isAnalyzing
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:scale-[1.02] hover:shadow-[0_8px_32px_rgba(255,228,196,0.25)] hover:bg-white/[0.08] hover:border-[#FFE4C4]/40'
                    }
                  `}
                  disabled={selectedSongs.size < 2 || isAnalyzing}
                  onClick={analyzeSongs}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FFE4C4]/10 via-transparent to-[#290924]/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative flex items-center justify-center gap-3">
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-6 w-6 animate-spin text-[#FFE4C4]" />
                        <span 
                          className="text-lg font-bold text-[#FFE4C4]"
                          style={{ textShadow: '0 0 8px rgba(255, 228, 196, 0.5), 0 0 15px rgba(255, 228, 196, 0.25)' }}
                        >
                          Analyzing Tracks...
                        </span>
                      </>
                    ) : (
                      <>
                        <Music className="h-6 w-6 text-[#FFE4C4]" />
                        <span 
                          className="text-lg font-bold bg-gradient-to-r from-[#FFE4C4] via-white to-[#FFE4C4] bg-clip-text text-transparent"
                          style={{ textShadow: '0 0 8px rgba(255, 228, 196, 0.4), 0 0 15px rgba(255, 228, 196, 0.2)' }}
                        >
                          {t.selectSongs} (BPM & Energy Detection)
                        </span>
                      </>
                    )}
                  </div>
                </button>
              ) : !mashupUrl ? (
                <button
                  className={`
                    group relative w-full p-6 rounded-2xl
                    backdrop-blur-xl bg-white/[0.03] border border-white/10
                    transition-all duration-500 ease-out
                    ${isProcessing
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:scale-[1.02] hover:shadow-[0_8px_32px_rgba(255,228,196,0.25)] hover:bg-white/[0.08] hover:border-[#FFE4C4]/40'
                    }
                  `}
                  disabled={isProcessing}
                  onClick={createIntelligentMashup}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FFE4C4]/10 via-transparent to-[#290924]/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative flex items-center justify-center gap-3">
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-6 w-6 animate-spin text-[#FFE4C4]" />
                        <span 
                          className="text-lg font-bold text-[#FFE4C4]"
                          style={{ textShadow: '0 0 8px rgba(255, 228, 196, 0.5), 0 0 15px rgba(255, 228, 196, 0.25)' }}
                        >
                          Creating {t.mashupGenerator}...
                        </span>
                      </>
                    ) : (
                      <>
                        <Shuffle className="h-6 w-6 text-[#FFE4C4]" />
                        <span 
                          className="text-lg font-bold bg-gradient-to-r from-[#FFE4C4] via-white to-[#FFE4C4] bg-clip-text text-transparent"
                          style={{ textShadow: '0 0 8px rgba(255, 228, 196, 0.4), 0 0 15px rgba(255, 228, 196, 0.2)' }}
                        >
                          {t.createMashup}
                        </span>
                      </>
                    )}
                  </div>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="relative p-6 rounded-2xl backdrop-blur-xl bg-white/[0.05] border border-[#FFE4C4]/40 shadow-[0_8px_32px_rgba(255,228,196,0.25)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FFE4C4]/15 via-transparent to-[#290924]/10 rounded-2xl animate-pulse"></div>
                    <div className="absolute -inset-1 bg-gradient-to-br from-[#FFE4C4]/20 to-transparent rounded-2xl blur-xl -z-10"></div>
                    
                    <div className="relative text-center mb-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FFE4C4]/20 mb-3 border border-[#FFE4C4]/30 shadow-[0_0_20px_rgba(255,228,196,0.3)]">
                        <Music className="h-8 w-8 text-[#FFE4C4] animate-pulse" />
                      </div>
                      <h3 
                        className="text-xl font-bold text-[#FFE4C4] mb-1"
                        style={{ textShadow: '0 0 8px rgba(255, 228, 196, 0.5), 0 0 15px rgba(255, 228, 196, 0.25)' }}
                      >
                        🎉 {t.nowPlaying}!
                      </h3>
                      <p className="text-sm text-gray-400">
                        {analyzedSongs.length} tracks intelligently mixed
                      </p>
                    </div>

                    <div className="relative flex gap-3">
                      <button
                        className="flex-1 p-4 rounded-xl backdrop-blur-xl bg-[#FFE4C4]/15 border border-[#FFE4C4]/40 hover:bg-[#FFE4C4]/25 transition-all duration-300 hover:scale-[1.02] shadow-[0_0_15px_rgba(255,228,196,0.2)]"
                        onClick={togglePlayback}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {isPlaying ? (
                            <>
                              <Pause className="h-5 w-5 text-[#FFE4C4]" />
                              <span 
                                className="font-bold text-[#FFE4C4]"
                                style={{ textShadow: '0 0 6px rgba(255, 228, 196, 0.5), 0 0 12px rgba(255, 228, 196, 0.25)' }}
                              >
                                {t.pause}
                              </span>
                            </>
                          ) : (
                            <>
                              <Play className="h-5 w-5 text-[#FFE4C4]" />
                              <span 
                                className="font-bold text-[#FFE4C4]"
                                style={{ textShadow: '0 0 6px rgba(255, 228, 196, 0.5), 0 0 12px rgba(255, 228, 196, 0.25)' }}
                              >
                                {t.play}
                              </span>
                            </>
                          )}
                        </div>
                      </button>
                      
                      <button
                        className="flex-1 p-4 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#FFE4C4]/30 transition-all duration-300 hover:scale-[1.02]"
                        onClick={downloadMashup}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Download className="h-5 w-5 text-white/90" />
                          <span className="font-bold text-white/90">Download</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  <button
                    className="w-full p-4 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#FFE4C4]/30 transition-all duration-300 hover:scale-[1.01]"
                    onClick={resetMashup}
                  >
                    <span className="font-bold text-white/90">{t.createMashup}</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
