import React from 'react';
import './SkeletonLoader.css';

interface SkeletonLoaderProps {
    type?: 'text' | 'card' | 'list' | 'table' | 'avatar' | 'button';
    lines?: number;
    width?: string | number;
    height?: string | number;
    className?: string;
    animated?: boolean;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
    type = 'text',
    lines = 1,
    width,
    height,
    className = '',
    animated = true
}) => {
    const baseClass = `skeleton ${type} ${animated ? 'animated' : ''} ${className}`;
    
    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;

    switch (type) {
        case 'text':
            return (
                <div className="skeleton-text-container">
                    {Array.from({ length: lines }).map((_, index) => (
                        <div
                            key={index}
                            className={`${baseClass} ${index === lines - 1 ? 'last-line' : ''}`}
                            style={style}
                        />
                    ))}
                </div>
            );

        case 'card':
            return (
                <div className="skeleton-card" style={style}>
                    <div className="skeleton skeleton-image" />
                    <div className="skeleton-content">
                        <div className="skeleton skeleton-title" />
                        <div className="skeleton skeleton-text" />
                        <div className="skeleton skeleton-text short" />
                    </div>
                </div>
            );

        case 'list':
            return (
                <div className="skeleton-list" style={style}>
                    {Array.from({ length: lines }).map((_, index) => (
                        <div key={index} className="skeleton-list-item">
                            <div className="skeleton skeleton-avatar" />
                            <div className="skeleton-list-content">
                                <div className="skeleton skeleton-text" />
                                <div className="skeleton skeleton-text short" />
                            </div>
                        </div>
                    ))}
                </div>
            );

        case 'table':
            return (
                <div className="skeleton-table" style={style}>
                    <div className="skeleton-table-header">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="skeleton skeleton-text" />
                        ))}
                    </div>
                    {Array.from({ length: lines }).map((_, rowIndex) => (
                        <div key={rowIndex} className="skeleton-table-row">
                            {Array.from({ length: 4 }).map((_, colIndex) => (
                                <div key={colIndex} className="skeleton skeleton-text" />
                            ))}
                        </div>
                    ))}
                </div>
            );

        case 'avatar':
            return (
                <div className={`skeleton-avatar ${baseClass}`} style={style} />
            );

        case 'button':
            return (
                <div className={`skeleton-button ${baseClass}`} style={style} />
            );

        default:
            return <div className={baseClass} style={style} />;
    }
};

export default SkeletonLoader;
