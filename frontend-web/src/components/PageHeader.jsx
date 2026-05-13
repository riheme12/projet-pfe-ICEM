import React from 'react';

/**
 * Reusable premium page header in a styled card container
 */
const PageHeader = ({ title, subtitle, icon, actions, badge }) => {
    return (
        <div className="relative mb-10">
            {/* Background decorative glow */}
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full -z-10"></div>
            
            <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[32px] p-6 pr-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all hover:shadow-xl hover:shadow-blue-900/5">
                <div className="flex items-center gap-6">
                    {/* Premium Icon Container */}
                    {icon && (
                        <div className="relative group">
                            <div className="absolute inset-0 bg-blue-600 blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            <div className="relative w-16 h-16 rounded-[22px] bg-[#1e1b4b] flex items-center justify-center text-white shadow-lg border border-white/10 overflow-hidden">
                                {React.cloneElement(icon, { size: 28, strokeWidth: 2.5 })}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent"></div>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex flex-col">
                        <div className="flex items-center gap-4 mb-1.5">
                            <h1 className="text-2xl font-black text-[#1e1b4b] tracking-tighter drop-shadow-sm">{title}</h1>
                            {badge && (
                                <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest ${badge.color || 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'}`}>
                                    {badge.label}
                                </span>
                            )}
                        </div>
                        {subtitle && (
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                <p className="text-[15px] text-slate-500 font-bold tracking-tight">{subtitle}</p>
                            </div>
                        )}
                    </div>
                </div>

                {actions && (
                    <div className="flex items-center gap-4 self-end lg:self-center">
                        <div className="flex items-center gap-3 p-1.5 bg-slate-50 rounded-[20px] border border-slate-100">
                            {actions}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PageHeader;
