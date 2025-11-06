import React, { useState, useRef, useEffect } from 'react';
import './DropdownMenu.css';

interface DropdownMenuProps {
    triggerLabel?: React.ReactNode;
    children: React.ReactNode;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ triggerLabel = '⋮', children }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (!ref.current) return;
            if (!ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('click', onDoc);
        return () => document.removeEventListener('click', onDoc);
    }, []);

    return (
        <div className="dm-root" ref={ref}>
            <button className="dm-trigger" onClick={() => setOpen(o => !o)}>{triggerLabel}</button>
            {open && <div className="dm-menu">{children}</div>}
        </div>
    );
};

export default DropdownMenu;
