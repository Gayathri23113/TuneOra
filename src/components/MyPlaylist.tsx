import { useEffect, useState } from 'react';
import { Play, Pause, Music2, Search as SearchIcon, Plus, X, Trash2, ListMusic } from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';
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

interface Playlist {
  id: string;
  name: string;
  songs: Song[];
  createdAt: number;
}

export const MyPlaylist = () => {
  const { playSong, currentSong, isPlaying, togglePlay } = usePlayer();
  const { t } = useLanguage();
  
  // State management
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredSong, setHoveredSong] = useState<number | null>(null);
  
  // Search states
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState('');
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  // Load songs
  useEffect(() => {
    const loadSongs = async () => {
      try {
        const response = await fetch('/songs/manifest.json');
        const fileList = await response.json();
        
        const songsWithMetadata = await Promise.all(
          fileList.map(async (filename: string, index: number) => {
            const audioPath = `/songs/${filename}`;
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
        
        setAllSongs(songsWithMetadata);
        setFilteredSongs(songsWithMetadata);
        setLoading(false);
      } catch (error) {
        console.error('Error loading songs:', error);
        setLoading(false);
      }
    };

    loadSongs();
  }, []);

  // Load playlists from localStorage
  useEffect(() => {
    const savedPlaylists = localStorage.getItem('tuneora_playlists');
    if (savedPlaylists) {
      setPlaylists(JSON.parse(savedPlaylists));
    }
  }, []);

  // Save playlists to localStorage
  useEffect(() => {
    if (playlists.length > 0 || playlists.length === 0) {
      localStorage.setItem('tuneora_playlists', JSON.stringify(playlists));
    }
  }, [playlists]);

  // Filter songs based on search
  useEffect(() => {
    if (songSearchQuery.trim() === '') {
      setFilteredSongs(allSongs);
    } else {
      const filtered = allSongs.filter(song => 
        song.title.toLowerCase().includes(songSearchQuery.toLowerCase()) ||
        song.artist.toLowerCase().includes(songSearchQuery.toLowerCase())
      );
      setFilteredSongs(filtered);
    }
  }, [songSearchQuery, allSongs]);

  const fetchAlbumArtFromInternet = async (songTitle: string): Promise<{ albumArt?: string; artist?: string }> => {
    try {
      const cleanTitle = songTitle.replace('.mp3', '').replace(/_/g, ' ').trim();
      const searchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanTitle)}&entity=song&limit=1`;
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          albumArt: result.artworkUrl100?.replace('100x100bb', '600x600bb'),
          artist: result.artistName
        };
      }
      return {};
    } catch (error) {
      return {};
    }
  };

  const extractAudioMetadata = async (src: string, filename: string): Promise<{ duration: number; albumArt?: string; artist?: string }> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.src = src;
      
      audio.addEventListener('loadedmetadata', async () => {
        const duration = Math.floor(audio.duration);
        const { albumArt, artist } = await fetchAlbumArtFromInternet(filename);
        resolve({ duration, albumArt, artist });
      });
      
      audio.addEventListener('error', () => {
        resolve({ duration: 0 });
      });
    });
  };

  const createPlaylist = () => {
    if (!newPlaylistName.trim()) {
      toast.error(t.enterPlaylistName || 'Please enter a playlist name');
      return;
    }

    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name: newPlaylistName.trim(),
      songs: [],
      createdAt: Date.now()
    };

    setPlaylists([...playlists, newPlaylist]);
    setSelectedPlaylist(newPlaylist);
    setNewPlaylistName('');
    setShowCreateModal(false);
    toast.success(`${t.createPlaylist || 'Playlist'} "${newPlaylist.name}" ${t.created || 'created'}!`);
  };

  const deletePlaylist = (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    setPlaylists(playlists.filter(p => p.id !== playlistId));
    if (selectedPlaylist?.id === playlistId) {
      setSelectedPlaylist(null);
    }
    toast.success(`${t.createPlaylist || 'Playlist'} "${playlist?.name}" ${t.deleted || 'deleted'}`);
  };

  const addSongToPlaylist = (song: Song) => {
    if (!selectedPlaylist) {
      toast.error(t.selectPlaylistFirst || 'Please select a playlist first');
      return;
    }

    const songExists = selectedPlaylist.songs.some(s => s.id === song.id);
    if (songExists) {
      toast.error(t.alreadyInPlaylist || 'Song already in playlist');
      return;
    }

    const updatedPlaylist = {
      ...selectedPlaylist,
      songs: [...selectedPlaylist.songs, song]
    };

    setPlaylists(playlists.map(p => p.id === selectedPlaylist.id ? updatedPlaylist : p));
    setSelectedPlaylist(updatedPlaylist);
    toast.success(`${t.addedTo || 'Added'} "${song.title}" ${selectedPlaylist.name}`);
  };

  const removeSongFromPlaylist = (songId: number) => {
    if (!selectedPlaylist) return;

    const updatedPlaylist = {
      ...selectedPlaylist,
      songs: selectedPlaylist.songs.filter(s => s.id !== songId)
    };

    setPlaylists(playlists.map(p => p.id === selectedPlaylist.id ? updatedPlaylist : p));
    setSelectedPlaylist(updatedPlaylist);
    toast.success(t.removedFrom || 'Song removed from playlist');
  };

  const handleCardClick = (song: Song) => {
    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      playSong(song);
    }
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
    return colors[title.charCodeAt(0) % colors.length];
  };

  const filteredPlaylists = playlists.filter(p =>
    p.name.toLowerCase().includes(playlistSearchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ fontFamily: 'Times New Roman, serif' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#360c30] via-[#290924] to-[#1b0618]" />
        <div className="relative z-10 p-8">
          <h1 
            className="text-4xl font-bold bg-gradient-to-r from-[#FFE4C4] via-white to-[#FFE4C4] bg-clip-text text-transparent"
            style={{ textShadow: '0 0 10px rgba(255, 228, 196, 0.4), 0 0 20px rgba(255, 228, 196, 0.2)' }}
          >
            {t.loading || 'Loading...'}
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden pb-32" style={{ fontFamily: 'Times New Roman, serif' }}>
      {/* Concert Background with Bisque */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#360c30] via-[#290924] to-[#1b0618]">
        <div className="absolute top-0 left-[15%] w-[400px] h-[400px] bg-[#FFE4C4]/15 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-0 right-[15%] w-[400px] h-[400px] bg-[#290924]/25 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#360c30]/20 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/3 left-[20%] w-[450px] h-[450px] bg-[#FFE4C4]/10 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 
              className="text-4xl md:text-6xl font-bold mb-3 bg-gradient-to-r from-[#FFE4C4] via-white to-[#FFE4C4] bg-clip-text text-transparent"
              style={{ textShadow: '0 0 10px rgba(255, 228, 196, 0.4), 0 0 20px rgba(255, 228, 196, 0.2)' }}
            >
              {t.myPlaylist}
            </h1>
            <div className="flex items-center gap-3">
              <div className="h-1 w-20 bg-gradient-to-r from-[#FFE4C4] via-[#FFE4C4]/50 to-transparent rounded-full"></div>
              <p className="text-gray-400 text-lg font-medium">{playlists.length} {t.playlists || 'playlists'}</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-[#FFE4C4]/15 hover:bg-[#FFE4C4]/25 border border-[#FFE4C4]/40 rounded-xl transition-all duration-300 hover:scale-105 shadow-[0_0_20px_rgba(255,228,196,0.2)] flex items-center gap-2"
          >
            <Plus className="h-5 w-5 text-[#FFE4C4]" />
            <span 
              className="text-[#FFE4C4] font-bold"
              style={{ textShadow: '0 0 8px rgba(255, 228, 196, 0.5), 0 0 15px rgba(255, 228, 196, 0.25)' }}
            >
              {t.createPlaylist}
            </span>
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Playlists */}
          <div className="col-span-3">
            {/* Playlist Search */}
            <div className="relative mb-4">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#FFE4C4]" />
              <input
                type="text"
                value={playlistSearchQuery}
                onChange={(e) => setPlaylistSearchQuery(e.target.value)}
                placeholder={`${t.search} ${t.playlists || 'playlists'}...`}
                className="w-full pl-10 pr-4 py-2 bg-white/[0.03] backdrop-blur-xl border border-[#FFE4C4]/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FFE4C4]/40 transition-all"
              />
            </div>

            {/* Playlists List */}
            <div className="space-y-2">
              {filteredPlaylists.length === 0 ? (
                <div className="text-center py-12">
                  <ListMusic className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">{t.createFirstPlaylist || 'Create your first playlist'}</p>
                </div>
              ) : (
                filteredPlaylists.map((playlist) => (
                  <div
                    key={playlist.id}
                    onClick={() => setSelectedPlaylist(playlist)}
                    className={`group p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                      selectedPlaylist?.id === playlist.id
                        ? 'bg-[#FFE4C4]/15 border border-[#FFE4C4]/40 shadow-[0_0_20px_rgba(255,228,196,0.2)]'
                        : 'bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] hover:border-[#FFE4C4]/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 
                          className={`font-bold truncate ${
                            selectedPlaylist?.id === playlist.id ? 'text-[#FFE4C4]' : 'text-white/85'
                          }`}
                          style={selectedPlaylist?.id === playlist.id ? { 
                            textShadow: '0 0 8px rgba(255, 228, 196, 0.5), 0 0 15px rgba(255, 228, 196, 0.25)' 
                          } : {}}
                        >
                          {playlist.name}
                        </h3>
                        <p className="text-xs text-gray-500">{playlist.songs.length} {t.songs || 'songs'}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePlaylist(playlist.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded-lg transition-all"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Content - Songs */}
          <div className="col-span-9">
            {/* Song Search */}
            <div className="relative mb-6">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#FFE4C4]" />
              <input
                type="text"
                value={songSearchQuery}
                onChange={(e) => setSongSearchQuery(e.target.value)}
                placeholder={`${t.search} ${t.allSongs}...`}
                className="w-full pl-12 pr-4 py-4 bg-white/[0.03] backdrop-blur-xl border border-[#FFE4C4]/20 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-[#FFE4C4]/40 focus:shadow-[0_0_30px_rgba(255,228,196,0.2)] transition-all"
              />
            </div>

            {/* Selected Playlist Songs */}
            {selectedPlaylist && selectedPlaylist.songs.length > 0 && (
              <div className="mb-8">
                <h2 
                  className="text-2xl font-bold text-[#FFE4C4] mb-4"
                  style={{ textShadow: '0 0 8px rgba(255, 228, 196, 0.5), 0 0 15px rgba(255, 228, 196, 0.25)' }}
                >
                  {selectedPlaylist.name}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {selectedPlaylist.songs.map((song, index) => {
                    const isCurrentSong = currentSong?.id === song.id;
                    const gradient = getGradientForSong(song.title);

                    return (
                      <div
                        key={song.id}
                        className="group relative animate-in fade-in zoom-in duration-500"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <div className="relative p-4 rounded-2xl backdrop-blur-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] hover:border-[#FFE4C4]/40 transition-all cursor-pointer">
                          <button
                            onClick={() => removeSongFromPlaylist(song.id)}
                            className="absolute -top-2 -right-2 z-10 p-1.5 bg-red-500/80 hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X className="h-3 w-3 text-white" />
                          </button>
                          
                          <div onClick={() => handleCardClick(song)} className="relative aspect-square mb-4 rounded-xl overflow-hidden">
                            {song.albumArt ? (
                              <img src={song.albumArt} alt={song.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                                <Music2 className="h-16 w-16 text-white/30" />
                              </div>
                            )}
                            
                            {isCurrentSong && isPlaying && (
                              <div className="absolute top-2 right-2 flex gap-1 items-end h-4">
                                {[0, 150, 300].map((delay, i) => (
                                  <div key={i} className="w-1 bg-[#FFE4C4] rounded-full shadow-[0_0_8px_rgba(255,228,196,0.8)]"
                                    style={{ animation: `equalizer 0.8s ease-in-out infinite`, animationDelay: `${delay}ms` }} />
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <h3 
                            className={`font-bold text-sm line-clamp-1 ${isCurrentSong ? 'text-[#FFE4C4]' : 'text-white/85'}`}
                            style={isCurrentSong ? { 
                              textShadow: '0 0 8px rgba(255, 228, 196, 0.5), 0 0 15px rgba(255, 228, 196, 0.25)' 
                            } : {}}
                          >
                            {song.title}
                          </h3>
                          <p className="text-xs text-gray-500 line-clamp-1">{song.artist}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Songs */}
            <h2 className="text-xl font-bold text-white/90 mb-4">
              {selectedPlaylist ? t.addSongs : t.allSongs}
            </h2>
            {filteredSongs.length === 0 ? (
              <div className="text-center py-12">
                <Music2 className="h-16 w-16 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">{t.noSongsFound}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredSongs.map((song, index) => {
                  const isCurrentSong = currentSong?.id === song.id;
                  const isHovered = hoveredSong === song.id;
                  const gradient = getGradientForSong(song.title);

                  return (
                    <div
                      key={song.id}
                      className="group relative"
                      onMouseEnter={() => setHoveredSong(song.id)}
                      onMouseLeave={() => setHoveredSong(null)}
                    >
                      <div className={`relative p-4 rounded-2xl backdrop-blur-xl bg-white/[0.03] border border-white/10 transition-all ${
                        isHovered ? 'scale-105 bg-white/[0.08] border-[#FFE4C4]/40' : ''
                      }`}>
                        {selectedPlaylist && (
                          <button
                            onClick={() => addSongToPlaylist(song)}
                            className="absolute -top-2 -right-2 z-10 p-1.5 bg-[#FFE4C4]/80 hover:bg-[#FFE4C4] rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-[0_0_15px_rgba(255,228,196,0.5)]"
                          >
                            <Plus className="h-3 w-3 text-black" />
                          </button>
                        )}
                        
                        <div onClick={() => handleCardClick(song)} className="cursor-pointer">
                          <div className="relative aspect-square mb-4 rounded-xl overflow-hidden">
                            {song.albumArt ? (
                              <img src={song.albumArt} alt={song.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                                <Music2 className="h-16 w-16 text-white/30" />
                              </div>
                            )}
                            
                            {isCurrentSong && isPlaying && (
                              <div className="absolute top-2 right-2 flex gap-1 items-end h-4">
                                {[0, 150, 300].map((delay, i) => (
                                  <div key={i} className="w-1 bg-[#FFE4C4] rounded-full"
                                    style={{ animation: `equalizer 0.8s ease-in-out infinite`, animationDelay: `${delay}ms` }} />
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <h3 
                            className={`font-bold text-sm line-clamp-1 ${isCurrentSong ? 'text-[#FFE4C4]' : 'text-white/85'}`}
                            style={isCurrentSong ? { 
                              textShadow: '0 0 8px rgba(255, 228, 196, 0.5), 0 0 15px rgba(255, 228, 196, 0.25)' 
                            } : {}}
                          >
                            {song.title}
                          </h3>
                          <p className="text-xs text-gray-500 line-clamp-1">{song.artist}</p>
                          <p className="text-xs text-gray-600">{formatDuration(song.duration)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md p-6 bg-gradient-to-br from-[#360c30] to-[#1b0618] border border-[#FFE4C4]/30 rounded-2xl shadow-[0_0_40px_rgba(255,228,196,0.3)]" style={{ fontFamily: 'Times New Roman, serif' }}>
            <h2 
              className="text-2xl font-bold text-[#FFE4C4] mb-4"
              style={{ textShadow: '0 0 8px rgba(255, 228, 196, 0.5), 0 0 15px rgba(255, 228, 196, 0.25)' }}
            >
              {t.createNewPlaylist || 'Create New Playlist'}
            </h2>
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createPlaylist()}
              placeholder={t.enterPlaylistName || 'Enter playlist name...'}
              className="w-full px-4 py-3 bg-white/5 border border-[#FFE4C4]/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#FFE4C4]/40 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewPlaylistName('');
                }}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
              >
                {t.cancel || 'Cancel'}
              </button>
              <button
                onClick={createPlaylist}
                className="flex-1 px-4 py-2 bg-[#FFE4C4] hover:bg-[#FFE4C4]/90 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(255,228,196,0.4)]"
              >
                {t.create || 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes equalizer {
          0%, 100% { height: 40%; }
          50% { height: 100%; }
        }
      `}</style>
    </div>
  );
};
