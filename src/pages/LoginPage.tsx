import React, { useState, FC, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css'; 
import BackgroundImage from '../assets/bgimg.jpg'; 
import { useAuth } from '../contexts/AuthContext';
import { auth as firebaseAuth } from '../firebase';
// import { MdMusicNote } from 'react-icons/md';

const LoginPage: FC = () => {
    const navigate = useNavigate();
  
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { signIn } = useAuth();
    const firebaseAvailable = !!firebaseAuth;

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            await signIn(email, password);
            navigate('/TuneOra');
        } catch (err) {
            console.error('Login failed', err);
            setError((err as Error).message || 'Login failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignup = () => {
        navigate('/RegisterPage');
    };

    return (
        <div 
            className="login-container"
            style={{ backgroundImage: `url(${BackgroundImage})` }}
        >
            <div className="login-box">
                {/* <div style={{ 
                    borderRadius: '50%',
                    width: '70px', 
                    height: '70px',
                    margin: '0 auto 15px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(156,39,176,0.5) 100%)', 
                    boxShadow: '0 0 15px rgba(156, 39, 176, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.4)'
                }}>
                    <MdMusicNote 
                        style={{ 
                            fontSize: '45px', 
                            color: 'white',
                            textShadow: '0 0 5px rgba(255,255,255,0.8)', 
                            position: 'relative', 
                            bottom: '1px'
                        }} 
                    />
                </div> */}
                <h1>TuneOra</h1>
                <p>Feel the Music, Understand the World.</p>

                {/* <h2>Login</h2>  */}

                <form onSubmit={handleLogin}>
                    {/* Email Input */}
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {/* Password Input */}
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            placeholder=""
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {/* Login Button */}
                    <button type="submit" className="login-button" disabled={isLoading || !firebaseAvailable}>
                        {isLoading ? 'Signing in...' : 'Login'}
                    </button>
                    {error && <div style={{ color: 'salmon', marginTop: 8 }}>{error}</div>}
                    {!firebaseAvailable && (
                        <div style={{ color: 'orange', marginTop: 8 }}>
                            Firebase is not configured. Add your config to <code>.env.local</code> (see README) and restart the dev server.
                        </div>
                    )}
                </form>

                {/* Signup Link with Navigation */}
                <div className="signup-text">
                    Don't have an account? 
                    <span 
                        className="signup-link" 
                        onClick={handleSignup}
                    >
                        Sign Up
                    </span>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;

