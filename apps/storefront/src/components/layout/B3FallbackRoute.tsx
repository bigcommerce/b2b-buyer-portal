import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { SetOpenPage } from '@/pages/SetOpenPage';

interface RedirectFallbackProps {
  path?: string;
  setOpenPage: SetOpenPage;
}

export function RedirectFallback({ path, setOpenPage }: RedirectFallbackProps) {
  const navigate = useNavigate();

  useEffect(() => {
    // Strategy 1: Use first available route
    if (path) {
      navigate(path, { replace: true });

      return;
    }

    // Strategy 2: Close the B2B app if no routes available
    setOpenPage({ isOpen: false });
  }, [path, navigate, setOpenPage]);

  return null; // This component doesn't render anything
}
