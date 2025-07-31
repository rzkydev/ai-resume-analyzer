import { Link, useLocation } from 'react-router';
import { usePuterStore } from '~/lib/puter';
import { useState } from 'react';

const Navbar = () => {
  const { auth } = usePuterStore();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);

  // Hide wipe button on certain pages
  const hideWipeButton =
    location.pathname === '/auth' || location.pathname === '/wipe';

  return (
    <nav className="navbar relative">
      <Link to="/">
        <p className="text-2xl font-bold text-gradient">RESUMECUY</p>
      </Link>

      <div className="flex items-center gap-4">
        {/* Upload Resume Button */}
        <Link to="/upload" className="primary-button w-fit">
          Unggah Resume
        </Link>

        {/* Menu Button for authenticated users */}
        {auth.isAuthenticated && !hideWipeButton && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              title="Menu"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <>
                {/* Overlay to close menu */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />

                {/* Menu Content */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                  <div className="py-2">
                    <Link
                      to="/wipe"
                      onClick={() => setShowMenu(false)}
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <span className="text-lg">🗑️</span>
                      <span className="font-medium">Kelola Data</span>
                    </Link>

                    <div className="border-t border-gray-100 my-1" />

                    <button
                      onClick={() => {
                        auth.signOut();
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors text-left"
                    >
                      <span className="text-lg">🚪</span>
                      <span className="font-medium">Keluar</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Show direct wipe button on wipe page */}
        {location.pathname === '/wipe' && (
          <Link
            to="/"
            className="flex items-center gap-2 border border-gray-200 rounded-lg p-2 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <svg
              className="w-4 h-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span className="text-gray-800 text-sm font-semibold">
              Kembali ke Beranda
            </span>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
