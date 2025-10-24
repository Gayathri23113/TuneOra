export interface Song {
  id: string;
  title: string;
  artist: string;
  language: 'English' | 'Telugu';
  src: string;
  duration: number; // in seconds
  lyrics?: {
    en: string;
    te: string;
  };
}

export const LOCAL_SONGS: Song[] = [
  {
    id: '1',
    title: 'Midnight Dreams',
    artist: 'Luna Wave',
    language: 'English',
    src: '/songs/song1.mp3',
    duration: 245,
    lyrics: {
      en: 'Under the stars we dance tonight\nHearts beating in the pale moonlight',
      te: 'నక్షత్రాల క్రింద మేము ఈ రాత్రి నృత్యం చేస్తాము\nవెలిగే చంద్రకాంతిలో హృదయాలు కొట్టుకుంటాయి'
    }
  },
  {
    id: '2',
    title: 'నీ చూపులో',
    artist: 'Rajesh Kumar',
    language: 'Telugu',
    src: '/songs/song2.mp3',
    duration: 198,
    lyrics: {
      en: 'In your eyes I find my home\nNever want to be alone',
      te: 'నీ చూపులో నా ఇల్లు కనుగొన్నాను\nఒంటరిగా ఉండాలని ఎప్పుడూ కోరుకోను'
    }
  },
  {
    id: '3',
    title: 'Electric Pulse',
    artist: 'Neon Nights',
    language: 'English',
    src: '/songs/song3.mp3',
    duration: 223,
    lyrics: {
      en: 'Feel the rhythm take control\nLet the music feed your soul',
      te: 'లయ నియంత్రణ తీసుకోవడం అనుభూతి చెందండి\nసంగీతం మీ ఆత్మను పోషించనివ్వండి'
    }
  },
  {
    id: '4',
    title: 'మనసు మాటలు',
    artist: 'Priya Sharma',
    language: 'Telugu',
    src: '/songs/song4.mp3',
    duration: 267,
    lyrics: {
      en: 'Words of the heart speak so true\nEvery moment spent with you',
      te: 'హృదయ మాటలు చాలా నిజంగా మాట్లాడతాయి\nమీతో గడిపిన ప్రతి క్షణం'
    }
  },
  {
    id: '5',
    title: 'Summer Breeze',
    artist: 'Coastal Vibes',
    language: 'English',
    src: '/songs/song5.mp3',
    duration: 189,
    lyrics: {
      en: 'Walking by the ocean blue\nSummer days were made for you',
      te: 'నీలి సముద్రం పక్కన నడుస్తూ\nవేసవి రోజులు మీ కోసం తయారు చేయబడ్డాయి'
    }
  }
];
