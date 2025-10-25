import { useEffect, useState } from 'react';
import { Play, Pause, Music2 } from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface Song {
  id: number;
  title: string;
  artist: string;
  language: string;
  src: string;
  duration: number;
  albumArt?: string;
}

export const Dashboard = () => {
  const { playSong, currentSong, isPlaying, togglePlay } = usePlayer();
  const { t } = useLanguage();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredSong, setHoveredSong] = useState<number | null>(null);

  useEffect(() => {
    const loadSongs = async () => {
      try {
        console.log('Fetching songs manifest...');
        const response = await fetch('/songs/manifest.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch manifest: ${response.status} ${response.statusText}`);
        }
        const fileList = await response.json();
        console.log('Found songs:', fileList);
        
        const songsWithMetadata = await Promise.all(
          fileList.map(async (filename: string, index: number) => {
            const audioPath = `/songs/${filename}`;
            console.log('Processing song:', audioPath);
            const metadata = await extractAudioMetadata(audioPath, filename);
            
            return {
              id: index + 1,
              title: filename.replace('.mp3', '').replace(/_/g, ' '),
              artist: metadata.artist || 'Unknown Artist',
              language: 'en',
              src: audioPath,
              duration: metadata.duration || 0,
              albumArt: metadata.albumArt
            };
          })
        );
        
        console.log('Loaded songs with metadata:', songsWithMetadata);
        setSongs(songsWithMetadata);
        (window as any).TUNEORA_SONGS = songsWithMetadata;
        setLoading(false);
      } catch (error) {
        console.error('Error loading songs:', error);
        // toast.error('Failed to load songs. Please check the songs directory.');
        setLoading(false);
      }
    };

    loadSongs();
  }, []);

  const fetchAlbumArtFromInternet = async (songTitle: string): Promise<{ albumArt?: string; artist?: string }> => {
    try {
      const cleanTitle = songTitle.replace('.mp3', '').replace(/_/g, ' ').trim();
      const searchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanTitle)}&entity=song&limit=1`;
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const artworkUrl = result.artworkUrl100;
        const highResArtwork = artworkUrl ? artworkUrl.replace('100x100bb', '600x600bb') : undefined;
        const artistName = result.artistName;
        
        return {
          albumArt: highResArtwork,
          artist: artistName
        };
      }
      
      return {};
    } catch (error) {
      console.error('Error fetching album art:', error);
      return {};
    }
  };

  const extractAudioMetadata = async (src: string, filename: string): Promise<{ duration: number; albumArt?: string; artist?: string }> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      
      const handleError = (e: ErrorEvent) => {
        console.error(`Error loading audio for ${filename}:`, e.message);
        resolve({ duration: 0 });
      };
      
      const handleLoadMetadata = async () => {
        try {
          const duration = Math.floor(audio.duration);
          console.log(`Duration for ${filename}:`, duration);
          const { albumArt, artist } = await fetchAlbumArtFromInternet(filename);
          resolve({ duration, albumArt, artist });
        } catch (error) {
          console.error(`Error getting metadata for ${filename}:`, error);
          resolve({ duration: 0 });
        }
      };
      
      audio.addEventListener('loadedmetadata', handleLoadMetadata);
      audio.addEventListener('error', handleError);
      
      // Set the source after adding event listeners
      audio.src = src;
    });
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  const handleCardClick = (song: Song) => {
    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      playSong(song);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ fontFamily: 'Times New Roman, serif' }}>
        {/* Concert Stage Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#360c30] via-[#290924] to-[#1b0618]">
          {/* Stage lights effect with bisque */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FFE4C4]/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#290924]/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-1/3 left-1/3 w-[500px] h-[500px] bg-[#360c30]/15 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          {/* Spotlight beams */}
          <div className="absolute top-0 left-1/4 w-1 h-full bg-gradient-to-b from-[#FFE4C4]/20 via-transparent to-transparent"></div>
          <div className="absolute top-0 right-1/3 w-1 h-full bg-gradient-to-b from-[#290924]/20 via-transparent to-transparent"></div>
          
          {/* Grid floor effect with bisque */}
          <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#1b0618] to-transparent">
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'linear-gradient(#FFE4C4 1px, transparent 1px), linear-gradient(90deg, #FFE4C4 1px, transparent 1px)',
              backgroundSize: '50px 50px',
              transform: 'perspective(500px) rotateX(60deg)',
              transformOrigin: 'bottom'
            }}></div>
          </div>
        </div>

        <div className="relative z-10 p-8">
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <h1 
              className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-[#FFE4C4] via-white to-[#FFE4C4] bg-clip-text text-transparent"
              style={{ textShadow: '0 0 10px rgba(255, 228, 196, 0.3), 0 0 20px rgba(255, 228, 196, 0.2)' }}
            >
              {t.allSongs || 'Your Library'}
            </h1>
            <p className="text-gray-400 text-lg">Loading your music...</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="group animate-pulse">
                <div className="relative aspect-square bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-lg mb-3 overflow-hidden border border-[#FFE4C4]/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                </div>
                <div className="h-4 bg-white/5 backdrop-blur-xl rounded-full mb-2 w-3/4"></div>
                <div className="h-3 bg-white/[0.03] backdrop-blur-xl rounded-full w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden pb-32" style={{ fontFamily: 'Times New Roman, serif' }}>
      {/* Concert Stage Background - Bisque Accents */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#360c30] via-[#290924] to-[#1b0618]">
        {/* Animated stage lights with bisque */}
        <div className="absolute top-0 left-[15%] w-[400px] h-[400px] bg-[#FFE4C4]/15 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-0 right-[15%] w-[400px] h-[400px] bg-[#290924]/25 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#360c30]/20 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/3 left-[20%] w-[450px] h-[450px] bg-[#FFE4C4]/10 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-1/3 right-[20%] w-[450px] h-[450px] bg-[#290924]/15 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        
        {/* Dramatic spotlight beams with bisque */}
        <div className="absolute top-0 left-[20%] w-2 h-full bg-gradient-to-b from-[#FFE4C4]/15 via-[#FFE4C4]/5 to-transparent blur-sm"></div>
        <div className="absolute top-0 left-[40%] w-2 h-full bg-gradient-to-b from-white/10 via-white/3 to-transparent blur-sm" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-0 right-[40%] w-2 h-full bg-gradient-to-b from-[#290924]/15 via-[#290924]/5 to-transparent blur-sm" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-0 right-[20%] w-2 h-full bg-gradient-to-b from-[#FFE4C4]/12 via-[#FFE4C4]/4 to-transparent blur-sm" style={{ animationDelay: '1.5s' }}></div>
        
        {/* Concert stage floor grid with bisque */}
        <div className="absolute bottom-0 left-0 right-0 h-80 bg-gradient-to-t from-[#1b0618] via-[#1b0618]/50 to-transparent">
          <div className="absolute inset-0 opacity-[0.15]" style={{
            backgroundImage: 'linear-gradient(#FFE4C4 1.5px, transparent 1.5px), linear-gradient(90deg, #FFE4C4 1.5px, transparent 1.5px)',
            backgroundSize: '60px 60px',
            transform: 'perspective(600px) rotateX(60deg)',
            transformOrigin: 'bottom',
            maskImage: 'linear-gradient(to top, black 0%, transparent 100%)'
          }}></div>
        </div>
        
        {/* Atmospheric smoke/fog effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1b0618]/80 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(27,6,24,0.4)_100%)]"></div>
      </div>

      {/* Content Layer */}
      <div className="relative z-10 p-8">
        {/* Header with subtle bisque text glow */}
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 
            className="text-4xl md:text-6xl font-bold mb-3 bg-gradient-to-r from-[#FFE4C4] via-white to-[#FFE4C4] bg-clip-text text-transparent"
            style={{ 
              textShadow: '0 0 10px rgba(255, 228, 196, 0.4), 0 0 20px rgba(255, 228, 196, 0.2)' 
            }}
          >
            {t.allSongs || 'Your Library'}
          </h1>
          <div className="flex items-center gap-3">
            <div className="h-1 w-20 bg-gradient-to-r from-[#FFE4C4] via-[#FFE4C4]/50 to-transparent rounded-full"></div>
            <p className="text-gray-400 text-lg font-medium">
              {songs.length} {songs.length === 1 ? 'song' : 'songs'}
            </p>
          </div>
        </div>

        {/* Songs Grid */}
        {songs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-700">
            <div className="relative">
              <div className="absolute inset-0 bg-[#FFE4C4]/30 blur-3xl rounded-full"></div>
              <Music2 className="relative h-24 w-24 text-gray-500 mb-6" strokeWidth={1} />
            </div>
            <p className="text-2xl font-semibold text-gray-400 mb-2">No songs found</p>
            <p className="text-sm text-gray-500">
              Add MP3 files to /public/songs folder
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {songs.map((song, index) => {
              const isCurrentSong = currentSong?.id === song.id;
              const isHovered = hoveredSong === song.id;
              const gradient = getGradientForSong(song.title);

              return (
                <div
                  key={song.id}
                  className="group relative animate-in fade-in zoom-in duration-500"
                  style={{ animationDelay: `${index * 30}ms` }}
                  onMouseEnter={() => setHoveredSong(song.id)}
                  onMouseLeave={() => setHoveredSong(null)}
                  onClick={() => handleCardClick(song)}
                >
                  {/* Enhanced Glassmorphism Card with bisque glow */}
                  <div className={`
                    relative p-4 rounded-2xl cursor-pointer
                    backdrop-blur-xl bg-white/[0.03] border border-white/10
                    transition-all duration-500 ease-out
                    ${isHovered || isCurrentSong 
                      ? 'scale-[1.05] shadow-[0_8px_32px_rgba(255,228,196,0.25)] bg-white/[0.08] border-[#FFE4C4]/40' 
                      : 'hover:scale-[1.02] shadow-lg hover:shadow-xl hover:bg-white/[0.05]'
                    }
                  `}>
                    {/* Concert-style glow with bisque */}
                    {(isHovered || isCurrentSong) && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-br from-[#FFE4C4]/15 via-transparent to-[#290924]/10 rounded-2xl animate-pulse"></div>
                        <div className="absolute -inset-1 bg-gradient-to-br from-[#FFE4C4]/20 to-transparent rounded-2xl blur-xl -z-10"></div>
                      </>
                    )}

                    {/* Album Art */}
                    <div className="relative aspect-square mb-4 rounded-xl overflow-hidden shadow-2xl">
                      {song.albumArt ? (
                        <>
                          <img 
                            src={song.albumArt} 
                            alt={song.title}
                            className={`
                              absolute inset-0 w-full h-full object-cover
                              transition-all duration-700 ease-out
                              ${isHovered ? 'scale-110' : 'scale-100'}
                            `}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        </>
                      ) : (
                        <>
                          <div className={`
                            absolute inset-0 bg-gradient-to-br ${gradient}
                            transition-all duration-700 ease-out
                            ${isHovered ? 'scale-110 opacity-100' : 'opacity-90'}
                          `}>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                          </div>
                          
                          <div className={`
                            absolute inset-0 flex items-center justify-center
                            transition-all duration-500 ease-out
                            ${isHovered ? 'scale-110 opacity-30' : 'scale-100 opacity-20'}
                          `}>
                            <Music2 className="h-16 w-16 text-white" strokeWidth={1.5} />
                          </div>
                        </>
                      )}

                      {/* Enhanced shimmer with bisque */}
                      <div className={`
                        absolute inset-0 bg-gradient-to-br from-[#FFE4C4]/20 via-white/10 to-transparent
                        transition-opacity duration-500
                        ${isHovered ? 'opacity-100' : 'opacity-0'}
                      `}></div>

                      {/* Song title overlay */}
                      <div className="absolute inset-0 flex items-end p-3">
                        <p 
                          className={`
                            text-white/80 text-xs font-semibold line-clamp-2
                            transition-all duration-300
                            ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-60'}
                          `}
                          style={{
                            textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)'
                          }}
                        >
                          {song.title}
                        </p>
                      </div>

                      {/* Enhanced play button with bisque glow */}
                      <div className={`
                        absolute inset-0 flex items-center justify-center
                        backdrop-blur-md bg-black/20
                        transition-all duration-500 ease-out
                        ${(isHovered || (isCurrentSong && isPlaying))
                          ? 'opacity-100' 
                          : 'opacity-0'
                        }
                      `}>
                        <div className={`
                          relative backdrop-blur-xl bg-white/95 rounded-full p-4
                          shadow-[0_0_30px_rgba(255,228,196,0.6)] border border-[#FFE4C4]/30
                          transform transition-all duration-500 ease-out
                          ${(isHovered || (isCurrentSong && isPlaying))
                            ? 'scale-100 rotate-0' 
                            : 'scale-75 rotate-180'
                          }
                          hover:scale-110 hover:bg-white hover:shadow-[0_0_40px_rgba(255,228,196,0.8)]
                        `}>
                          <div className="absolute inset-0 bg-[#FFE4C4]/40 rounded-full blur-xl"></div>
                          
                          {isCurrentSong && isPlaying ? (
                            <Pause className="relative h-7 w-7 text-black" fill="currentColor" />
                          ) : (
                            <Play className="relative h-7 w-7 text-black ml-0.5" fill="currentColor" />
                          )}
                        </div>
                      </div>

                      {/* Enhanced visualizer with bisque */}
                      {isCurrentSong && isPlaying && (
                        <div className="absolute top-3 right-3 backdrop-blur-lg bg-black/40 rounded-full px-2 py-1.5 border border-[#FFE4C4]/40 shadow-[0_0_15px_rgba(255,228,196,0.3)]">
                          <div className="flex gap-1 items-end h-4">
                            <div className="w-1 bg-[#FFE4C4] rounded-full shadow-[0_0_8px_rgba(255,228,196,0.8)]" 
                              style={{ 
                                height: '60%',
                                animation: 'equalizer 0.8s ease-in-out infinite',
                                animationDelay: '0ms' 
                              }}></div>
                            <div className="w-1 bg-[#FFE4C4] rounded-full shadow-[0_0_8px_rgba(255,228,196,0.8)]" 
                              style={{ 
                                height: '100%',
                                animation: 'equalizer 0.8s ease-in-out infinite',
                                animationDelay: '150ms' 
                              }}></div>
                            <div className="w-1 bg-[#FFE4C4] rounded-full shadow-[0_0_8px_rgba(255,228,196,0.8)]" 
                              style={{ 
                                height: '80%',
                                animation: 'equalizer 0.8s ease-in-out infinite',
                                animationDelay: '300ms' 
                              }}></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Song info with subtle bisque text glow for current song */}
                    <div className="relative space-y-1">
                      <h3 
                        className={`
                          font-bold text-sm line-clamp-1
                          transition-all duration-300 ease-out
                          ${isCurrentSong 
                            ? 'text-[#FFE4C4]' 
                            : isHovered
                            ? 'text-white/95'
                            : 'text-white/85'
                          }
                        `}
                        style={isCurrentSong ? { 
                          textShadow: '0 0 8px rgba(255, 228, 196, 0.5), 0 0 15px rgba(255, 228, 196, 0.25)' 
                        } : {}}
                      >
                        {song.title}
                      </h3>
                      <p className={`
                        text-xs line-clamp-1 transition-colors duration-300
                        ${isHovered ? 'text-gray-400' : 'text-gray-500'}
                      `}>
                        {song.artist}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className={`
                          text-xs transition-colors duration-300
                          ${isHovered ? 'text-gray-400' : 'text-gray-600'}
                        `}>
                          {formatDuration(song.duration)}
                        </p>
                        {isCurrentSong && (
                          <span 
                            className="text-xs text-[#FFE4C4] font-semibold animate-pulse"
                            style={{ 
                              textShadow: '0 0 6px rgba(255, 228, 196, 0.5), 0 0 12px rgba(255, 228, 196, 0.25)' 
                            }}
                          >
                            Playing
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Keyframes for equalizer animation */}
      <style>{`
        @keyframes equalizer {
          0%, 100% { height: 40%; }
          50% { height: 100%; }
        }
      `}</style>
    </div>
  );
};
