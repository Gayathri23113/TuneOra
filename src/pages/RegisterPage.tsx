import React, { useState, FC, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css'; 
import BackgroundImage from '../assets/bgimg.jpg'; 
// import { MdMusicNote } from 'react-icons/md';
import { registerUser } from '../firebase';
import { auth as firebaseAuth } from '../firebase';

// Custom Message Component to replace alert()
interface MessageModalProps {
    message: string;
    onClose: () => void;
}

const MessageModal: FC<MessageModalProps> = ({ message, onClose }) => (
    <div className="message-box">
        <p>{message}</p>
        <button onClick={onClose}>OK</button>
    </div>
);

const RegisterPage: FC = () => {
    const navigate = useNavigate();
    
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const firebaseAvailable = !!firebaseAuth;

    const handleRegister = (e: FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setMessage("Passwords do not match!");
            return;
        }

        console.log('Attempting registration with:', { username, email, password });
        setMessage(null);
        setIsLoading(true);

        if (!firebaseAvailable) {
            setMessage('Firebase is not configured. Please add your Firebase config to .env.local and restart the dev server.');
            setIsLoading(false);
            return;
        }

        // Perform Firebase registration
        registerUser({ email, password, fullName: username })
            .then(() => {
                setMessage('Registration successful! Please sign in.');
            })
            .catch((err) => {
                console.error('Registration error', err);
                setMessage((err as Error).message || 'Registration failed.');
            })
            .finally(() => setIsLoading(false));
    };

    const handleCloseMessage = () => {
        setMessage(null);
            // 💡 UPDATED NAVIGATION: Navigate to the login page (root path) after closing the success message
        if (message === "Registration successful! Please sign in.") {
            navigate('/LoginPage');
        }
    }

    const handleLoginNavigation = () => {
        navigate('/'); // Navigate to the root path (LoginPage)
    };

    return (
        <div 
            className="login-container" 
            style={{ backgroundImage: `url(${BackgroundImage})` }}
        >
            <div className="login-box" style={{ height: 'auto', paddingBottom: '20px' }}>
                
                {/* STYLIZED ICON AND HEADER */}
                <div style={{ marginBottom: '20px' }}>                     
                    <h1 style={{ color: '#f48fb1' }}>Join TuneOra</h1>
                    <p style={{ marginBottom: '0' }}>Start your musical journey</p>
                </div>

                <form onSubmit={handleRegister}>
                    {/* Full Name (Username) Input */}
                    <div className="input-group">
                        <label htmlFor="username">Full Name</label>
                        <input
                            type="text"
                            id="username"
                            placeholder="John Doe"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    
                    {/* Email Input */}
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="your@email.com"
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

                    {/* Confirm Password Input */}
                    <div className="input-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            placeholder=""
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="login-button" disabled={isLoading}>
                        {isLoading ? 'Registering...' : 'Register'}
                    </button>
                </form>

                <div className="signup-text">
                    Already have an account? 
                    <span className="signup-link" onClick={handleLoginNavigation}>
                        Sign in
                    </span>
                </div>
            </div>

            {/* Render the custom message box if 'message' state is set */}
            {message && <MessageModal message={message} onClose={handleCloseMessage} />}
        </div>
    );
};

export default RegisterPage;

