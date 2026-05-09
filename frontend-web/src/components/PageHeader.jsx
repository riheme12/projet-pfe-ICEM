import React from 'react';

/**
 * Reusable page header with consistent styling across all pages
 * Props:
 *   - title: main heading string
 *   - subtitle: description text
 *   - icon: lucide-react icon element
 *   - actions: JSX element(s) for action buttons
 *   - badge: { label, color } optional badge
 */
const PageHeader = ({ title, subtitle, icon, actions, badge }) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
                {icon && (
                    <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 flex-shrink-0">
                        {React.cloneElement(icon, { size: 20 })}
                    </div>
                )}
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-slate-800">{title}</h1>
                        {badge && (
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${badge.color || 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                {badge.label}
                            </span>
                        )}
                    </div>
                    {subtitle && (
                        <p className="text-xs text-slate-400 font-medium mt-0.5">{subtitle}</p>
                    )}
                </div>
            </div>
            {actions && (
                <div className="flex items-center gap-2.5 flex-shrink-0">
                    {actions}
                </div>
            )}
        </div>
    );
};

export default PageHeader;
