import React from 'react';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, Lock } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthRequired = ({ title = "Authentication Required", message = "Please sign in to access this feature and manage your bookings." }) => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-sm w-full bg-white/80 backdrop-blur-xl rounded-[32px] p-10 shadow-2xl shadow-emerald-900/10 border border-white"
            >
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock size={32} className="text-emerald-500" />
                </div>

                <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
                    {title}
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-8">
                    {message}
                </p>

                <div className="space-y-3">
                    <button
                        onClick={() => navigate('/login', { state: { from: location.pathname } })}
                        className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <LogIn size={18} />
                        Sign In Now
                    </button>
                    
                    <button
                        onClick={() => navigate('/signup')}
                        className="w-full bg-gray-50 text-gray-600 font-bold py-4 rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-gray-100"
                    >
                        <UserPlus size={18} />
                        Create Account
                    </button>
                </div>
                
                <p className="mt-8 text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                    NowStay Premium Hospitality
                </p>
            </motion.div>
        </div>
    );
};

export default AuthRequired;
