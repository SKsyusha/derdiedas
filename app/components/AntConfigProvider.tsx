'use client';

import { ConfigProvider, theme as antTheme } from 'antd';
import { useTheme } from './ThemeProvider';
import { ReactNode } from 'react';

interface AntConfigProviderProps {
  children: ReactNode;
}

export default function AntConfigProvider({ children }: AntConfigProviderProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <ConfigProvider
      theme={{
        // Use dark or default algorithm based on theme
        algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          // Seed Token - primary color
          colorPrimary: '#8b5cf6',
          borderRadius: 12,
          
          // Map Token overrides for custom dark theme colors
          colorBgContainer: isDark ? '#171717' : '#ffffff',
          colorBgElevated: isDark ? '#1f1f1f' : '#ffffff',
          colorBgLayout: isDark ? '#0f0f0f' : '#ffffff',
          colorBorder: isDark ? '#2a2a2a' : '#e5e7eb',
          colorText: isDark ? '#e5e5e5' : '#171717',
          colorTextSecondary: isDark ? '#a1a1aa' : '#6b7280',
        },
        components: {
          Button: {
            borderRadius: 8,
            controlHeight: 40,
            primaryColor: '#ffffff',
            algorithm: true, // Enable algorithm for proper color derivation
          },
          Card: {
            borderRadius: 16,
            paddingLG: 24,
          },
          Drawer: {
            colorBgElevated: isDark ? '#171717' : '#ffffff',
            algorithm: true,
          },
          Input: {
            borderRadius: 8,
            controlHeight: 40,
            colorBorder: isDark ? '#3f3f46' : '#e5e7eb',
            colorBgContainer: isDark ? '#1f1f1f' : '#ffffff',
            algorithm: true,
          },
          Select: {
            borderRadius: 8,
            controlHeight: 40,
            colorBgContainer: isDark ? '#1f1f1f' : '#ffffff',
            algorithm: true,
          },
          Dropdown: {
            colorBgElevated: isDark ? '#171717' : '#ffffff',
            algorithm: true,
          },
          Progress: {
            algorithm: true,
          },
          Checkbox: {
            algorithm: true,
          },
          Radio: {
            algorithm: true,
          },
          Divider: {
            colorSplit: isDark ? '#2a2a2a' : '#e5e7eb',
          },
          Typography: {
            algorithm: true,
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
