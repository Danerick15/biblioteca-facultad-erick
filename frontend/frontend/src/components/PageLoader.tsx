import React from 'react';
import SkeletonLoader from './SkeletonLoader';
import './PageLoader.css';

interface PageLoaderProps {
    type?: 'dashboard' | 'catalog' | 'profile' | 'list' | 'table';
    message?: string;
}

const PageLoader: React.FC<PageLoaderProps> = ({ 
    type = 'dashboard', 
    message = "Cargando contenido..." 
}) => {
    const renderSkeletonContent = () => {
        switch (type) {
            case 'dashboard':
                return (
                    <div className="page-loader-content">
                        <div className="page-loader-header">
                            <SkeletonLoader type="text" lines={2} width="60%" />
                        </div>
                        <div className="page-loader-stats">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <SkeletonLoader key={index} type="card" width="100%" height="120px" />
                            ))}
                        </div>
                        <div className="page-loader-sections">
                            <SkeletonLoader type="card" width="100%" height="300px" />
                            <SkeletonLoader type="card" width="100%" height="250px" />
                        </div>
                    </div>
                );

            case 'catalog':
                return (
                    <div className="page-loader-content">
                        <div className="page-loader-header">
                            <SkeletonLoader type="text" lines={2} width="70%" />
                        </div>
                        <div className="page-loader-search">
                            <SkeletonLoader type="button" width="100%" height="48px" />
                        </div>
                        <div className="page-loader-grid">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <SkeletonLoader key={index} type="card" width="100%" height="280px" />
                            ))}
                        </div>
                    </div>
                );

            case 'profile':
                return (
                    <div className="page-loader-content">
                        <div className="page-loader-header">
                            <SkeletonLoader type="text" lines={2} width="50%" />
                        </div>
                        <div className="page-loader-profile">
                            <div className="profile-skeleton-left">
                                <SkeletonLoader type="avatar" width="120px" height="120px" />
                                <SkeletonLoader type="text" lines={3} width="80%" />
                            </div>
                            <div className="profile-skeleton-right">
                                <SkeletonLoader type="card" width="100%" height="200px" />
                            </div>
                        </div>
                        <div className="page-loader-sections">
                            <SkeletonLoader type="card" width="100%" height="300px" />
                        </div>
                    </div>
                );

            case 'list':
                return (
                    <div className="page-loader-content">
                        <div className="page-loader-header">
                            <SkeletonLoader type="text" lines={2} width="60%" />
                        </div>
                        <div className="page-loader-filters">
                            <SkeletonLoader type="button" width="200px" height="40px" />
                            <SkeletonLoader type="button" width="150px" height="40px" />
                        </div>
                        <div className="page-loader-list">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <SkeletonLoader key={index} type="list" lines={1} width="100%" height="80px" />
                            ))}
                        </div>
                    </div>
                );

            case 'table':
                return (
                    <div className="page-loader-content">
                        <div className="page-loader-header">
                            <SkeletonLoader type="text" lines={2} width="60%" />
                        </div>
                        <div className="page-loader-table">
                            <SkeletonLoader type="table" lines={5} width="100%" height="400px" />
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="page-loader-content">
                        <div className="page-loader-header">
                            <SkeletonLoader type="text" lines={2} width="60%" />
                        </div>
                        <div className="page-loader-sections">
                            <SkeletonLoader type="card" width="100%" height="300px" />
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="page-loader">
            <div className="page-loader-message">
                <div className="loading-spinner"></div>
                <p>{message}</p>
            </div>
            {renderSkeletonContent()}
        </div>
    );
};

export default PageLoader;
