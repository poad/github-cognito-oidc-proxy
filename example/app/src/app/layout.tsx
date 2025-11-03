'use client';
import { ReactNode } from 'react';

interface ReactNodeProps { children: ReactNode }

export default function Layout({ children }: ReactNodeProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
