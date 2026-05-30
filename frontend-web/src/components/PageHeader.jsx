import React from 'react';

/**
 * Reusable premium page header in a styled card container
 */
const PageHeader = ({ title, subtitle, icon, actions, badge }) => {
    return (
        <div className="relative mb-12 group/header">
            {/* 🎨 Premium Light Command Center Theme */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-10 bg-gradient-to-br from-white/95 via-blue-50/90 to-white/80 backdrop-blur-2xl rounded-[45px] shadow-[0_15px_40px_-10px_rgba(30,27,75,0.05)] border border-white relative overflow-hidden group">
                <div className="absolute inset-0 opacity-[0.3] pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-300/30 rounded-full blur-[80px] animate-pulse"></div>
                <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-indigo-300/30 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }}></div>
                
                <div className="relative z-10 flex items-center gap-6">
                    {icon && (
                        <div className="relative group-hover/header:scale-105 transition-transform duration-500">
                            <div className="absolute inset-0 bg-blue-400 blur-xl opacity-20 group-hover/header:opacity-40 transition-opacity"></div>
                            <div className="w-16 h-16 bg-white border border-blue-100/50 rounded-2xl flex items-center justify-center text-blue-600 relative z-10 shadow-xl group-hover/header:rotate-6 transition-transform duration-500">
                                {React.cloneElement(icon, { size: 32, strokeWidth: 2.5 })}
                            </div>
                        </div>
                    )}
                    
                    <div className="flex flex-col">
                        <div className="flex items-center gap-5 mb-2">
                            <h1 className="text-4xl font-black text-slate-900 tracking-normal drop-shadow-sm">{title}</h1>
                            {badge && (
                                <span className={`text-sm font-black px-4 py-2 rounded-2xl uppercase tracking-[0.2em] shadow-sm ${badge.color || 'bg-blue-100 text-blue-600 border border-blue-200'}`}>
                                    {badge.label}
                                </span>
                            )}
                        </div>
                        {subtitle && (
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse"></div>
                                <p className="text-slate-500 font-bold text-sm tracking-widest uppercase">{subtitle}</p>
                            </div>
                        )}
                    </div>
                </div>

                {actions && (
                    <div className="flex items-center gap-4 self-end lg:self-center relative z-10">
                        <div className="flex items-center gap-4">
                            {actions}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PageHeader;
