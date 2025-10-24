import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

interface Song {
  id: number;
  title: string;
  artist: string;
  language: string;
  src: string;
  duration: number;
}

interface PlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playSong: (song: Song) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seekTo: (time: number) => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(new Audio());

  // Handle both song loading and play state in a single effect
  useEffect(() => {
    const audio = audioRef.current;
    
    if (currentSong) {
      console.log('Loading song:', currentSong.src);
      audio.src = currentSong.src;
      audio.load();
    }

    if (isPlaying && audio.src) {
      audio.play()
        .then(() => {
          console.log('Playback started successfully');
        })
        .catch(error => {
          console.error('Error playing song:', error);
          setIsPlaying(false);
          toast.error('Failed to play song. Please check if the audio file exists.');
        });
    } else {
      audio.pause();
    }
  }, [currentSong, isPlaying]);

  // Update time and duration
  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      playNext();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const playSong = (song: Song) => {
    setCurrentSong(song);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const playNext = () => {
    const songs = (window as any).TUNEORA_SONGS || [];
    if (!currentSong || songs.length === 0) return;
    
    const currentIndex = songs.findIndex((s: Song) => s.id === currentSong.id);
    const nextIndex = (currentIndex + 1) % songs.length;
    playSong(songs[nextIndex]);
  };

  const playPrevious = () => {
    const songs = (window as any).TUNEORA_SONGS || [];
    if (!currentSong || songs.length === 0) return;
    
    const currentIndex = songs.findIndex((s: Song) => s.id === currentSong.id);
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    playSong(songs[prevIndex]);
  };

  const seekTo = (time: number) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        currentTime,
        duration,
        playSong,
        togglePlay,
        playNext,
        playPrevious,
        seekTo,
        audioRef
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider');
  }
  return context;
};
