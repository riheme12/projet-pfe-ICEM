import React from 'react';

/**
 * Reusable premium page header in a styled card container
 */
const PageHeader = ({ title, subtitle, icon, actions, badge }) => {
    return (
        <div className="relative mb-12 group/header">
            {/* 🎨 Creative Animated Glows */}
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-blue-600/10 rounded-full blur-[80px] -z-10 animate-pulse"></div>
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-indigo-600/10 rounded-full blur-[60px] -z-10 animate-float"></div>
            
            <div className="glass-panel rounded-[40px] p-8 pr-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1 overflow-hidden relative">
                {/* Decorative Pattern Background */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#1e1b4b_1px,transparent_1px)] [background-size:20px_20px]"></div>

                <div className="flex items-center gap-8 relative z-10">
                    {/* Premium Icon Container - More Creative */}
                    {icon && (
                        <div className="relative group/icon">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 blur-2xl opacity-20 group-hover/header:opacity-40 transition-opacity"></div>
                            <div className="relative w-20 h-20 rounded-[28px] bg-[#1e1b4b] flex items-center justify-center text-white shadow-2xl border border-white/10 overflow-hidden transform group-hover/header:rotate-6 transition-transform duration-500">
                                {React.cloneElement(icon, { size: 32, strokeWidth: 2.5 })}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"></div>
                                <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-white/5 rounded-full blur-xl"></div>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex flex-col">
                        <div className="flex items-center gap-5 mb-2">
                            <h1 className="text-3xl font-black text-[#0f172a] tracking-tight">{title}</h1>
                            {badge && (
                                <span className={`text-[10px] font-black px-4 py-2 rounded-2xl uppercase tracking-[0.2em] shadow-lg shadow-blue-600/20 ${badge.color || 'bg-blue-600 text-white'}`}>
                                    {badge.label}
                                </span>
                            )}
                        </div>
                        {subtitle && (
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                                <p className="text-[16px] text-slate-500 font-bold tracking-tight opacity-80">{subtitle}</p>
                            </div>
                        )}
                    </div>
                </div>

                {actions && (
                    <div className="flex items-center gap-4 self-end lg:self-center relative z-10">
                        <div className="flex items-center gap-4 p-2.5 bg-white/40 backdrop-blur-md rounded-[24px] border border-white/60 shadow-inner">
                            {actions}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PageHeader;
