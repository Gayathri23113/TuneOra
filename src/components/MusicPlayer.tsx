import { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music2, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { usePlayer } from '@/contexts/PlayerContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface Lyrics {
  original: string;
  translated?: string;
  language?: string;
}

export const MusicPlayer = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    playNext,
    playPrevious,
    seekTo
  } = usePlayer();
  const { language, t } = useLanguage();
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<Lyrics | null>(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState<string>('te'); // Default to Telugu
  const [detectedSourceLanguage, setDetectedSourceLanguage] = useState<string>('en');

  // Reset lyrics when song changes
  useEffect(() => {
    setShowLyrics(false);
    setLyrics(null);
    setDetectedSourceLanguage('en');
  }, [currentSong?.id]);

  // Helper function for language names
  const getLanguageName = (code: string): string => {
    const names: Record<string, string> = {
      'en': 'English',
      'te': 'Telugu (తెలుగు)',
      'hi': 'Hindi (हिंदी)',
      'ta': 'Tamil (தமிழ்)',
      'kn': 'Kannada (ಕನ್ನಡ)',
      'fr': 'French (Français)',
      'es': 'Spanish (Español)',
      'de': 'German (Deutsch)',
      'ja': 'Japanese (日本語)',
      'ko': 'Korean (한국어)',
      'zh': 'Chinese (中文)',
      'ar': 'Arabic (العربية)',
      'ru': 'Russian (Русский)',
      'pt': 'Portuguese (Português)',
      'it': 'Italian (Italiano)'
    };
    return names[code] || code.toUpperCase();
  };

  // Detect language of text using a free API
  const detectLanguage = async (text: string): Promise<string> => {
    try {
      // Use first 500 characters for detection
      const sample = text.substring(0, 500);
      
      // Try LibreTranslate language detection
      const response = await fetch('https://libretranslate.com/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: sample })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          console.log(`🌍 Detected language: ${data[0].language}`);
          return data[0].language; // Returns 'en', 'es', 'te', etc.
        }
      }
    } catch (error) {
      console.log('Language detection failed, assuming English');
    }
    
    return 'en'; // Default to English
  };

  // Fetch lyrics from multiple sources IN PARALLEL with fallback
  const fetchLyrics = async (songTitle: string, artistName: string): Promise<string | null> => {
    const cleanTitle = songTitle.replace('.mp3', '').replace(/_/g, ' ').trim();
    const cleanArtist = artistName.trim();

    // Create all API calls in parallel
    const lyricsPromises = [
      // LRCLIB API
      fetch(`https://lrclib.net/api/get?artist_name=${encodeURIComponent(cleanArtist)}&track_name=${encodeURIComponent(cleanTitle)}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.plainLyrics || data?.syncedLyrics) {
            console.log('✅ Lyrics found on LRCLIB');
            return data.plainLyrics || data.syncedLyrics.replace(/\[\d{2}:\d{2}\.\d{2}\]/g, '').trim();
          }
          return null;
        })
        .catch(() => null),

      // Lyrics.ovh API
      fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.lyrics) {
            console.log('✅ Lyrics found on Lyrics.ovh');
            return data.lyrics;
          }
          return null;
        })
        .catch(() => null),

      // LRCLIB search (title only)
      fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(cleanTitle)}`)
        .then(res => res.ok ? res.json() : null)
        .then(results => {
          if (results && results.length > 0) {
            const firstResult = results[0];
            if (firstResult.plainLyrics || firstResult.syncedLyrics) {
              console.log('✅ Lyrics found on LRCLIB (search)');
              return firstResult.plainLyrics || firstResult.syncedLyrics.replace(/\[\d{2}:\d{2}\.\d{2}\]/g, '').trim();
            }
          }
          return null;
        })
        .catch(() => null),

      // Genius API scraping fallback
      fetch(`https://some-random-api.com/lyrics?title=${encodeURIComponent(cleanTitle)}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.lyrics) {
            console.log('✅ Lyrics found on Some Random API');
            return data.lyrics;
          }
          return null;
        })
        .catch(() => null)
    ];

    try {
      // Wait for the first successful result
      const results = await Promise.all(lyricsPromises);
      
      // Return the first non-null result
      for (const result of results) {
        if (result) {
          return result;
        }
      }

      console.log('❌ No lyrics found from any source');
      return null;
    } catch (error) {
      console.error('Error fetching lyrics:', error);
      return null;
    }
  };

  // Translate lyrics using MULTIPLE APIs in parallel with fallback
  const translateLyrics = async (text: string, sourceLang: string, targetLang: string): Promise<string | null> => {
    // Don't translate if source and target are the same
    if (sourceLang === targetLang) {
      return text;
    }

    // Split into smaller chunks for better translation
    const maxChunkSize = 500;
    const chunks: string[] = [];
    const lines = text.split('\n');
    let currentChunk = '';

    for (const line of lines) {
      if ((currentChunk + line).length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = line + '\n';
      } else {
        currentChunk += line + '\n';
      }
    }
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    // Try multiple translation APIs in parallel
    const translationPromises = chunks.map(async (chunk) => {
      // Try LibreTranslate first
      try {
        const response = await fetch('https://libretranslate.com/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: chunk,
            source: sourceLang,
            target: targetLang,
            format: 'text'
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.translatedText) {
            return data.translatedText;
          }
        }
      } catch (error) {
        console.log('LibreTranslate failed for chunk');
      }

      // Fallback to MyMemory API
      try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${sourceLang}|${targetLang}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.responseData?.translatedText) {
          return data.responseData.translatedText;
        }
      } catch (error) {
        console.log('MyMemory failed for chunk');
      }

      // Fallback to Lingva Translate (Google Translate alternative)
      try {
        const url = `https://lingva.ml/api/v1/${sourceLang}/${targetLang}/${encodeURIComponent(chunk)}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.translation) {
          return data.translation;
        }
      } catch (error) {
        console.log('Lingva failed for chunk');
      }

      // If all fail, return original chunk
      return chunk;
    });

    try {
      const translatedChunks = await Promise.all(translationPromises);
      return translatedChunks.join('\n\n');
    } catch (error) {
      console.error('Translation failed:', error);
      return null;
    }
  };

  const handleFetchLyrics = async () => {
    if (!currentSong) return;

    setIsLoadingLyrics(true);
    toast.info('🔍 Searching for lyrics...', {
      description: 'Fetching and detecting language...'
    });

    try {
      // Fetch original lyrics
      const originalLyrics = await fetchLyrics(currentSong.title, currentSong.artist);
      
      if (originalLyrics) {
        // Detect source language
        const detectedLang = await detectLanguage(originalLyrics);
        setDetectedSourceLanguage(detectedLang);
        
        // Show original lyrics immediately
        setLyrics({
          original: originalLyrics,
          language: detectedLang
        });
        setShowLyrics(true);
        
        // Translate if target language is different from source
        if (detectedLang !== targetLanguage) {
          toast.info(`🌐 Translating to ${getLanguageName(targetLanguage)}...`);
          const translated = await translateLyrics(originalLyrics, detectedLang, targetLanguage);
          
          if (translated) {
            setLyrics({
              original: originalLyrics,
              translated: translated,
              language: detectedLang
            });
            toast.success('✅ Lyrics loaded with translation!');
          } else {
            toast.success('✅ Lyrics loaded!', {
              description: 'Translation unavailable'
            });
          }
        } else {
          toast.success('✅ Lyrics loaded!');
        }
      } else {
        toast.error('❌ Lyrics not found', {
          description: 'Try another song'
        });
      }
    } catch (error) {
      console.error('Error fetching lyrics:', error);
      toast.error('Failed to fetch lyrics');
    } finally {
      setIsLoadingLyrics(false);
    }
  };

  // Handle language change - re-translate if lyrics are loaded
  const handleLanguageChange = async (newTargetLang: string) => {
    setTargetLanguage(newTargetLang);
    
    if (lyrics?.original && detectedSourceLanguage !== newTargetLang) {
      setIsLoadingLyrics(true);
      toast.info(`🌐 Translating to ${getLanguageName(newTargetLang)}...`);
      
      try {
        const translated = await translateLyrics(lyrics.original, detectedSourceLanguage, newTargetLang);
        
        if (translated) {
          setLyrics({
            ...lyrics,
            translated: translated
          });
          toast.success('✅ Translation complete!');
        } else {
          setLyrics({
            ...lyrics,
            translated: undefined
          });
          toast.error('Translation failed');
        }
      } catch (error) {
        toast.error('Translation error');
      } finally {
        setIsLoadingLyrics(false);
      }
    } else if (lyrics?.original && detectedSourceLanguage === newTargetLang) {
      // Same language, remove translation
      setLyrics({
        ...lyrics,
        translated: undefined
      });
    }
  };

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (value: number[]) => {
    if (seekTo) {
      seekTo(value[0]);
    }
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!currentSong) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 p-4 z-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            <Music2 className="h-5 w-5" />
            <p className="text-sm">{t.selectSongs || 'Select a song to start playing'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Lyrics Panel - Slides up from bottom - SIDE BY SIDE */}
      <div className={`
        fixed bottom-0 left-0 right-0 z-40
        transition-transform duration-500 ease-out
        ${showLyrics ? 'translate-y-[-140px]' : 'translate-y-full'}
      `}>
        <div className="max-w-6xl mx-auto px-4 pb-4">
          <div className="relative backdrop-blur-3xl bg-black/80 border border-white/30 rounded-t-3xl shadow-2xl overflow-hidden">
            {/* Animated background gradient with bisque */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#FFE4C4]/10 via-transparent to-purple-500/10"></div>
            
            {/* Header with Language Controls */}
            <div className="relative flex items-center justify-between p-4 border-b border-white/20">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-[#FFE4C4] rounded-full animate-pulse shadow-[0_0_8px_rgba(255,228,196,0.6)]"></div>
                <h4 
                  className="text-sm font-bold text-[#FFE4C4]"
                  style={{ textShadow: '0 0 8px rgba(255, 228, 196, 0.5), 0 0 15px rgba(255, 228, 196, 0.25)' }}
                >
                  Lyrics
                </h4>
                
                {/* Detected Language Badge */}
                {detectedSourceLanguage && (
                  <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
                    Source: {getLanguageName(detectedSourceLanguage)}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                {/* Target Language Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Translate to:</span>
                  <select
                    value={targetLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    disabled={isLoadingLyrics}
                    className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:border-[#FFE4C4]/40 hover:bg-white/15 transition-all disabled:opacity-50"
                  >
                    <option value="en" className="bg-gray-900">English</option>
                    <option value="te" className="bg-gray-900">తెలుగు (Telugu)</option>
                    <option value="hi" className="bg-gray-900">हिंदी (Hindi)</option>
                    <option value="ta" className="bg-gray-900">தமிழ் (Tamil)</option>
                    <option value="kn" className="bg-gray-900">ಕನ್ನಡ (Kannada)</option>
                    <option value="fr" className="bg-gray-900">Français (French)</option>
                    <option value="es" className="bg-gray-900">Español (Spanish)</option>
                    <option value="de" className="bg-gray-900">Deutsch (German)</option>
                    <option value="ja" className="bg-gray-900">日本語 (Japanese)</option>
                    <option value="ko" className="bg-gray-900">한국어 (Korean)</option>
                    <option value="zh" className="bg-gray-900">中文 (Chinese)</option>
                    <option value="ar" className="bg-gray-900">العربية (Arabic)</option>
                    <option value="ru" className="bg-gray-900">Русский (Russian)</option>
                    <option value="pt" className="bg-gray-900">Português (Portuguese)</option>
                    <option value="it" className="bg-gray-900">Italiano (Italian)</option>
                  </select>
                </div>

                {/* Loading indicator */}
                {isLoadingLyrics && (
                  <div className="flex items-center gap-2 px-3 py-1.5">
                    <Loader2 className="h-3 w-3 text-[#FFE4C4] animate-spin" />
                    <span className="text-xs text-muted-foreground">Translating...</span>
                  </div>
                )}

                {/* Close Button */}
                <button
                  onClick={() => setShowLyrics(false)}
                  className="group relative w-7 h-7 rounded-lg backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 flex items-center justify-center"
                >
                  <X className="h-4 w-4 text-foreground group-hover:text-white" />
                </button>
              </div>
            </div>

            {/* Side-by-side Lyrics Content */}
            <div className="relative p-6 max-h-[400px] overflow-y-auto custom-scrollbar">
              <div className={`grid gap-6 ${lyrics?.translated ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {/* Original Lyrics - LEFT */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                    <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                    <h5 className="text-xs font-bold text-blue-400">
                      {getLanguageName(detectedSourceLanguage)} (Original)
                    </h5>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-line text-foreground">
                    {lyrics?.original}
                  </p>
                </div>

                {/* Translated Lyrics - RIGHT */}
                {lyrics?.translated && (
                  <div className="space-y-2 border-l border-white/10 pl-6">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                      <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                      <h5 className="text-xs font-bold text-purple-400">
                        {getLanguageName(targetLanguage)} (Translation)
                      </h5>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">
                      {lyrics.translated}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Gradient fade at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none"></div>
          </div>
        </div>
      </div>

      {/* Player Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/98 to-black/95 backdrop-blur-xl border-t border-white/10 z-50">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex items-center gap-6">
            {/* Album Art & Song Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Album Art */}
              <div className="relative w-14 h-14 rounded-lg overflow-hidden shadow-xl flex-shrink-0 border border-[#FFE4C4]/20">
                {currentSong.albumArt ? (
                  <>
                    <img 
                      src={currentSong.albumArt} 
                      alt={currentSong.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FFE4C4]/40 to-[#FFE4C4]/20">
                    <Music2 className="absolute inset-0 m-auto h-6 w-6 text-white/30" />
                  </div>
                )}
                
                {/* Animated bars when playing with bisque */}
                {isPlaying && (
                  <div className="absolute bottom-2 left-2 flex gap-0.5 items-end h-3">
                    <div className="w-0.5 bg-[#FFE4C4] rounded-full shadow-lg shadow-[#FFE4C4]/50" 
                      style={{ height: '60%', animation: 'equalizer 0.8s ease-in-out infinite' }}></div>
                    <div className="w-0.5 bg-[#FFE4C4] rounded-full shadow-lg shadow-[#FFE4C4]/50" 
                      style={{ height: '100%', animation: 'equalizer 0.8s ease-in-out infinite', animationDelay: '150ms' }}></div>
                    <div className="w-0.5 bg-[#FFE4C4] rounded-full shadow-lg shadow-[#FFE4C4]/50" 
                      style={{ height: '80%', animation: 'equalizer 0.8s ease-in-out infinite', animationDelay: '300ms' }}></div>
                  </div>
                )}
              </div>

              {/* Song Info */}
              <div className="min-w-0 flex-1">
                <h3 
                  className="font-semibold truncate text-foreground hover:underline cursor-pointer"
                  style={isPlaying ? { 
                    textShadow: '0 0 8px rgba(255, 228, 196, 0.3), 0 0 15px rgba(255, 228, 196, 0.15)' 
                  } : {}}
                >
                  {currentSong.title}
                </h3>
                <p className="text-sm text-muted-foreground truncate hover:underline cursor-pointer">
                  {currentSong.artist}
                </p>
              </div>

              {/* Lyrics Button */}
              <button
                onClick={handleFetchLyrics}
                disabled={isLoadingLyrics || showLyrics}
                className={`
                  group relative px-3 py-1.5 rounded-lg backdrop-blur-xl border transition-all duration-300
                  ${showLyrics 
                    ? 'bg-[#FFE4C4]/20 border-[#FFE4C4]/30 shadow-[0_0_15px_rgba(255,228,196,0.3)]' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:scale-105'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <div className="flex items-center gap-2">
                  {isLoadingLyrics ? (
                    <Loader2 className="h-3 w-3 text-[#FFE4C4] animate-spin" />
                  ) : (
                    <Music2 className={`h-3 w-3 ${showLyrics ? 'text-[#FFE4C4]' : 'text-muted-foreground group-hover:text-foreground'}`} />
                  )}
                  <span 
                    className={`text-xs font-semibold ${showLyrics ? 'text-[#FFE4C4]' : 'text-muted-foreground group-hover:text-foreground'}`}
                    style={showLyrics ? { 
                      textShadow: '0 0 6px rgba(255, 228, 196, 0.5), 0 0 12px rgba(255, 228, 196, 0.25)' 
                    } : {}}
                  >
                    {isLoadingLyrics ? 'Loading...' : showLyrics ? 'Lyrics' : 'Show Lyrics'}
                  </span>
                </div>
              </button>
            </div>

            {/* Center: Playback Controls */}
            <div className="flex-1 flex flex-col items-center gap-2 max-w-2xl">
              {/* Control Buttons */}
              <div className="flex items-center gap-4">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={playPrevious}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all hover:scale-110"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>

                <Button
                  size="icon"
                  variant="default"
                  className="h-10 w-10 rounded-full bg-white hover:bg-white/90 hover:scale-110 transition-all shadow-xl"
                  onClick={togglePlay}
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5 text-black" fill="currentColor" />
                  ) : (
                    <Play className="h-5 w-5 text-black ml-0.5" fill="currentColor" />
                  )}
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={playNext}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all hover:scale-110"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="w-full flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
                  {formatTime(currentTime)}
                </span>
                
                <div className="flex-1 group">
                  <Slider
                    value={[currentTime]}
                    max={duration || 100}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="cursor-pointer"
                  />
                </div>

                <span className="text-xs text-muted-foreground w-10 tabular-nums">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Right: Progress Percentage */}
            <div className="flex-1 flex justify-end items-center">
              <div className="text-xs font-semibold text-[#FFE4C4] bg-[#FFE4C4]/10 px-3 py-1.5 rounded-full border border-[#FFE4C4]/20 shadow-[0_0_10px_rgba(255,228,196,0.2)]">
                {progressPercentage.toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes equalizer {
          0%, 100% { height: 40%; }
          50% { height: 100%; }
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 228, 196, 0.3);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 228, 196, 0.5);
        }
      `}</style>
    </>
  );
};
