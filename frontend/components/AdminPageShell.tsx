'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface AdminPageShellProps {
  children: ReactNode;
  /** Rendered as a sibling of the fade-in motion.div (e.g. a modal overlay). */
  overlay?: ReactNode;
}

const AdminPageShell = ({ children, overlay }: AdminPageShellProps) => (
  <div className="min-h-screen bg-gray-50 p-8">
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      {children}
    </motion.div>
    {overlay}
  </div>
);

export default AdminPageShell;
