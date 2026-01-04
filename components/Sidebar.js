'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Sidebar.module.css';

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
        router.refresh();
    };

    const toggleSidebar = () => setIsOpen(!isOpen);
    const closeSidebar = () => setIsOpen(false);

    const menuItems = [
        { name: 'Overview', path: '/dashboard' },
        { name: 'Products', path: '/inventory/products' },
        { name: 'Services', path: '/inventory/services' },
        { name: 'New Sale (POS)', path: '/pos' },
    ];

    return (
        <>
            {/* Hamburger Button (Mobile Only) */}
            <button
                className={styles.hamburgerBtn}
                onClick={toggleSidebar}
                aria-label="Toggle Menu"
            >
                ☰
            </button>

            {/* Overlay (Mobile Only) */}
            <div
                className={`${styles.overlay} ${isOpen ? styles.open : ''}`}
                onClick={closeSidebar}
            />

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
                <div className={styles.logoContainer}>
                    <h2 className={styles.logoTitle}>Ahsania</h2>
                    <p className={styles.logoSubtitle}>Management System</p>
                </div>

                <nav className={styles.nav}>
                    {menuItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`${styles.navLink} ${isActive ? styles.activeLink : ''}`}
                                onClick={closeSidebar} // Close on mobile when link clicked
                            >
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <button
                    onClick={handleLogout}
                    className={styles.logoutButton}
                >
                    Log Out
                </button>
            </aside>
        </>
    );
}
