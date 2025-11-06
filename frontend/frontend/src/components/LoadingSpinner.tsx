import React, { memo } from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
    message?: string;
    size?: 'small' | 'medium' | 'large';
    fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = memo(({ 
    message = "Cargando...", 
    size = 'medium',
    fullScreen = false 
}) => {
    const sizeClasses = {
        small: 'spinner-small',
        medium: 'spinner-medium',
        large: 'spinner-large'
    };

    const containerClass = fullScreen ? 'loading-fullscreen' : 'loading-container';

    return (
        <div className={containerClass}>
            <div className={`loading-spinner ${sizeClasses[size]}`}>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
            </div>
            <p className="loading-text">{message}</p>
        </div>
    );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
