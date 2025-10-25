import { Home, Shuffle, Music, Globe, LogIn, LogOut, Search, ListMusic, ChevronDown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface SidebarProps {
  currentView: 'dashboard' | 'mashup' | 'search' | 'playlist';
  onViewChange: (view: 'dashboard' | 'mashup' | 'search' | 'playlist') => void;
}

const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
  { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
] as const;

export const Sidebar = ({ currentView, onViewChange }: SidebarProps) => {
  const { language, setLanguage, t } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isLoggedIn = !!user;
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const selectedLanguage = LANGUAGE_OPTIONS.find(lang => lang.code === language) || LANGUAGE_OPTIONS[0];

  return (
    <aside className="w-64 flex flex-col h-screen relative overflow-hidden" style={{ fontFamily: 'Times New Roman, serif' }}>
      {/* Concert Stage Background with Bisque */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#360c30] via-[#290924] to-[#1b0618]">
        {/* Stage lights effect with bisque */}
        <div className="absolute top-1/4 left-1/2 w-32 h-32 bg-[#FFE4C4]/15 rounded-full blur-[80px] animate-pulse"></div>
        <div className="absolute bottom-1/3 left-1/2 w-40 h-40 bg-[#290924]/20 rounded-full blur-[90px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Vertical spotlight beams with bisque */}
        <div className="absolute top-0 left-1/3 w-1 h-full bg-gradient-to-b from-[#FFE4C4]/20 via-[#FFE4C4]/5 to-transparent blur-sm"></div>
        <div className="absolute top-0 right-1/3 w-1 h-full bg-gradient-to-b from-white/10 via-white/3 to-transparent blur-sm" style={{ animationDelay: '0.5s' }}></div>
      </div>

      {/* Right border with bisque glow */}
      <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#FFE4C4]/40 to-transparent shadow-[0_0_10px_rgba(255,228,196,0.2)]"></div>

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col h-full backdrop-blur-xl">
        {/* Logo Section with enhanced bisque glow */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="relative">
              <Music className="w-8 h-8 text-[#FFE4C4]" />
              <div className="absolute -inset-2 bg-[#FFE4C4]/30 blur-xl rounded-full -z-10"></div>
              <div className="absolute -inset-1 bg-[#FFE4C4]/40 blur-lg rounded-full -z-10 animate-pulse"></div>
            </div>
            <h1 
              className="text-2xl font-bold bg-gradient-to-r from-[#FFE4C4] via-white to-[#FFE4C4] bg-clip-text text-transparent"
              style={{ textShadow: '0 0 10px rgba(255, 228, 196, 0.4), 0 0 20px rgba(255, 228, 196, 0.2)' }}
            >
              TuneOra
            </h1>
          </div>

          {/* Enhanced User Welcome Card with bisque styling */}
          {/* {isLoggedIn && (
            <div className="mb-6 p-4 bg-gradient-to-br from-[#FFE4C4]/15 to-[#FFE4C4]/5 border border-[#FFE4C4]/30 rounded-xl backdrop-blur-sm shadow-[0_0_20px_rgba(255,228,196,0.15)]">
              <p className="text-sm font-medium text-white/90">
                {t.welcome}, <span 
                  className="text-[#FFE4C4] font-semibold"
                  style={{ textShadow: '0 0 8px rgba(255, 228, 196, 0.5), 0 0 15px rgba(255, 228, 196, 0.25)' }}
                >
                  {t.user}
                </span>!
              </p>
            </div>
          )} */}
        </div>

        {/* Navigation with bisque hover effects */}
        <nav className="flex-1 px-3 space-y-2">
          <Button
            variant={currentView === 'dashboard' ? 'default' : 'ghost'}
            className={`w-full justify-start h-12 text-base transition-all ${
              currentView === 'dashboard'
                ? 'bg-[#FFE4C4]/15 text-[#FFE4C4] hover:bg-[#FFE4C4]/20 border border-[#FFE4C4]/40 shadow-[0_0_20px_rgba(255,228,196,0.2)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-[#FFE4C4]/20'
            }`}
            onClick={() => onViewChange('dashboard')}
            style={currentView === 'dashboard' ? { 
              textShadow: '0 0 8px rgba(255, 228, 196, 0.5), 0 0 15px rgba(255, 228, 196, 0.25)' 
            } : {}}
          >
            <Home className={`mr-3 h-5 w-5 ${currentView === 'dashboard' ? 'text-[#FFE4C4] drop-shadow-[0_0_8px_rgba(255,228,196,0.5)]' : ''}`} />
            {t.dashboard || 'Your Library'}
          </Button>

          <Button
            variant={currentView === 'mashup' ? 'default' : 'ghost'}
            className={`w-full justify-start h-12 text-base transition-all ${
              currentView === 'mashup'
                ? 'bg-[#FFE4C4]/15 text-[#FFE4C4] hover:bg-[#FFE4C4]/20 border border-[#FFE4C4]/40 shadow-[0_0_20px_rgba(255,228,196,0.2)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-[#FFE4C4]/20'
            }`}
            onClick={() => onViewChange('mashup')}
            style={currentView === 'mashup' ? { 
              textShadow: '0 0 8px rgba(255, 228, 196, 0.5), 0 0 15px rgba(255, 228, 196, 0.25)' 
            } : {}}
          >
            <Shuffle className={`mr-3 h-5 w-5 ${currentView === 'mashup' ? 'text-[#FFE4C4] drop-shadow-[0_0_8px_rgba(255,228,196,0.5)]' : ''}`} />
            {t.mashupGenerator || 'AI DJ Mashup'}
          </Button>

          <Button
            variant={currentView === 'search' ? 'default' : 'ghost'}
            className={`w-full justify-start h-12 text-base transition-all ${
              currentView === 'search'
                ? 'bg-[#FFE4C4]/15 text-[#FFE4C4] hover:bg-[#FFE4C4]/20 border border-[#FFE4C4]/40 shadow-[0_0_20px_rgba(255,228,196,0.2)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-[#FFE4C4]/20'
            }`}
            onClick={() => onViewChange('search')}
            style={currentView === 'search' ? { 
              textShadow: '0 0 8px rgba(255, 228, 196, 0.5), 0 0 15px rgba(255, 228, 196, 0.25)' 
            } : {}}
          >
            <Search className={`mr-3 h-5 w-5 ${currentView === 'search' ? 'text-[#FFE4C4] drop-shadow-[0_0_8px_rgba(255,228,196,0.5)]' : ''}`} />
            {t.search || 'Search'}
          </Button>

          <Button
            variant={currentView === 'playlist' ? 'default' : 'ghost'}
            className={`w-full justify-start h-12 text-base transition-all ${
              currentView === 'playlist'
                ? 'bg-[#FFE4C4]/15 text-[#FFE4C4] hover:bg-[#FFE4C4]/20 border border-[#FFE4C4]/40 shadow-[0_0_20px_rgba(255,228,196,0.2)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-[#FFE4C4]/20'
            }`}
            onClick={() => onViewChange('playlist')}
            style={currentView === 'playlist' ? { 
              textShadow: '0 0 8px rgba(255, 228, 196, 0.5), 0 0 15px rgba(255, 228, 196, 0.25)' 
            } : {}}
          >
            <ListMusic className={`mr-3 h-5 w-5 ${currentView === 'playlist' ? 'text-[#FFE4C4] drop-shadow-[0_0_8px_rgba(255,228,196,0.5)]' : ''}`} />
            {t.myPlaylist || 'My Playlist'}
          </Button>
        </nav>

        {/* Enhanced Bottom Section - Profile + Language */}
        <div className="p-4 space-y-8 border-t border-[#FFE4C4]/20 mt-auto">
          {/* My Profile button (above language) */}
          {isLoggedIn && (
            <div>
              <Button
                variant="ghost"
                className="w-full justify-start h-11 text-base text-gray-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-[#FFE4C4]/20"
                onClick={() => navigate('/Profile')}
              >
                <User className="mr-3 h-4 w-4" />
                  {(t as any).myProfile || 'My Profile'}
              </Button>
            </div>
          )}

          {/* Language Dropdown with bisque glow */}
          <div className="relative">
            <div className="p-3 bg-white/5 hover:bg-[#FFE4C4]/10 rounded-lg transition-all duration-300 border border-white/5 hover:border-[#FFE4C4]/30 hover:shadow-[0_0_15px_rgba(255,228,196,0.1)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-gray-400">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-medium">{t.language || 'Language'}</span>
                </div>
              </div>
              
              <button
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="w-full flex items-center justify-between px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#FFE4C4]/40 rounded-lg transition-all"
              >
                <span className="flex items-center gap-2 text-sm text-white/90 font-medium">
                  <span>{selectedLanguage.flag}</span>
                  <span>{selectedLanguage.name}</span>
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showLanguageDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showLanguageDropdown && (
                <>
                  {/* Backdrop to close dropdown when clicking outside */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowLanguageDropdown(false)}
                  />
                  
                  {/* Dropdown menu with bisque styling */}
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-gradient-to-br from-[#360c30] to-[#1b0618] border border-[#FFE4C4]/30 rounded-lg shadow-[0_0_30px_rgba(255,228,196,0.3)] max-h-64 overflow-y-auto backdrop-blur-xl z-50">
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code as any);
                          setShowLanguageDropdown(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 ${
                          language === lang.code
                            ? 'bg-[#FFE4C4]/20 text-[#FFE4C4] font-semibold shadow-[0_0_15px_rgba(255,228,196,0.2)]'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                        }`}
                        style={language === lang.code ? { 
                          textShadow: '0 0 8px rgba(255, 228, 196, 0.5), 0 0 15px rgba(255, 228, 196, 0.25)' 
                        } : {}}
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <span className="font-medium">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Enhanced Login/Logout Button with bisque styling */}
          <Button
            variant="outline"
            className="w-full h-11 border-white/10 hover:border-[#FFE4C4]/50 hover:bg-[#FFE4C4]/10 transition-all text-gray-400 hover:text-white hover:shadow-[0_0_15px_rgba(255,228,196,0.15)]"
            onClick={() => {
              if (isLoggedIn) {
                signOut();
                navigate('/');
              } else {
                navigate('/LoginPage');
              }
            }}
          >
            {isLoggedIn ? (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                {t.logout || 'Logout'}
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                {t.login || 'Login'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Additional ambient lighting effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(27,6,24,0.3)_100%)] pointer-events-none"></div>
    </aside>
  );
};
