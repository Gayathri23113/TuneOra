// import { useState } from 'react';
// import { Sidebar } from '@/components/Sidebar';
// import { Dashboard } from '@/components/Dashboard';
// import { MashupGenerator } from '@/components/MashupGenerator';
// import { MusicPlayer } from '@/components/MusicPlayer';
// import { LanguageProvider } from '@/contexts/LanguageContext';
// import { AuthProvider } from '@/contexts/AuthContext';
// import { PlayerProvider } from '@/contexts/PlayerContext';

// const TuneOra = () => {
//   const [currentView, setCurrentView] = useState<'dashboard' | 'mashup'>('dashboard');

//   return (
//     <AuthProvider>
//       <LanguageProvider>
//         <PlayerProvider>
//           <div className="flex h-screen w-full overflow-hidden">
//             <Sidebar currentView={currentView} onViewChange={setCurrentView} />
            
//             <main className="flex-1 overflow-y-auto pb-48">
//               {currentView === 'dashboard' ? <Dashboard /> : <MashupGenerator />}
//             </main>

//             <MusicPlayer />
//           </div>
//         </PlayerProvider>
//       </LanguageProvider>
//     </AuthProvider>
//   );
// };

// export default TuneOra;








// import { useState } from 'react';
// import { Sidebar } from '@/components/Sidebar';
// import { Dashboard } from '@/components/Dashboard';
// import { MashupGenerator } from '@/components/MashupGenerator';
// import { Search } from '@/components/Search';
// import { MusicPlayer } from '@/components/MusicPlayer';
// import { LanguageProvider } from '@/contexts/LanguageContext';
// import { AuthProvider } from '@/contexts/AuthContext';
// import { PlayerProvider } from '@/contexts/PlayerContext';

// const TuneOra = () => {
//   const [currentView, setCurrentView] = useState<'dashboard' | 'mashup' | 'search'>('dashboard');

//   return (
//     <AuthProvider>
//       <LanguageProvider>
//         <PlayerProvider>
//           <div className="flex h-screen w-full overflow-hidden">
//             <Sidebar currentView={currentView} onViewChange={setCurrentView} />
            
//             <main className="flex-1 overflow-y-auto pb-48">
//               {currentView === 'dashboard' && <Dashboard />}
//               {currentView === 'mashup' && <MashupGenerator />}
//               {currentView === 'search' && <Search />}
//             </main>

//             <MusicPlayer />
//           </div>
//         </PlayerProvider>
//       </LanguageProvider>
//     </AuthProvider>
//   );
// };

// export default TuneOra;










import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/components/Dashboard';
import { MashupGenerator } from '@/components/MashupGenerator';
import { Search } from '@/components/Search';
import { MyPlaylist } from '@/components/MyPlaylist';
import { MusicPlayer } from '@/components/MusicPlayer';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { PlayerProvider } from '@/contexts/PlayerContext';

const TuneOra = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'mashup' | 'search' | 'playlist'>('dashboard');

  return (
    <AuthProvider>
      <LanguageProvider>
        <PlayerProvider>
          <div className="flex h-screen w-full overflow-hidden">
            <Sidebar currentView={currentView} onViewChange={setCurrentView} />
            
            <main className="flex-1 overflow-y-auto pb-48">
              {currentView === 'dashboard' && <Dashboard />}
              {currentView === 'mashup' && <MashupGenerator />}
              {currentView === 'search' && <Search />}
              {currentView === 'playlist' && <MyPlaylist />}
            </main>

            <MusicPlayer />
          </div>
        </PlayerProvider>
      </LanguageProvider>
    </AuthProvider>
  );
};

export default TuneOra;
