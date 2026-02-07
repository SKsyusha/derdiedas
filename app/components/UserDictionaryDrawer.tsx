'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { Drawer, Input, Button, Typography, Empty, Popconfirm, App } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  mergeImportedWordsIntoUserDictionaries,
  parseUserDictionaryImportText,
  UserDictionaryState,
} from '../utils/userDictionaryImport';
import type { Word } from '../types';
import { getCookie, setCookie } from '../utils/cookies';
import {
  createDictionary,
  updateDictionary,
  isPersistedDictionaryId,
} from '../services/userDictionaryService';

const { Text } = Typography;

const USER_DICTIONARY_ID_COOKIE = 'userDictionaryId';

type UserDictionary = UserDictionaryState;

interface UserDictionaryDrawerProps {
  open: boolean;
  onClose: () => void;
  userDictionaries: UserDictionary[];
  setUserDictionaries: React.Dispatch<React.SetStateAction<UserDictionary[]>>;
  onDictionaryCreated?: (dictId: string) => void;
  onAfterImport?: (nextUserDictionaries: UserDictionary[]) => void;
}

export default function UserDictionaryDrawer({
  open,
  onClose,
  userDictionaries,
  setUserDictionaries,
  onDictionaryCreated,
  onAfterImport,
}: UserDictionaryDrawerProps) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [isMobile, setIsMobile] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);

  const scrollDrawerToTop = useCallback(() => {
    if (typeof document === 'undefined') return;
    const body = document.querySelector(
      '.user-dictionary-drawer .ant-drawer-body'
    ) as HTMLElement | null;
    body?.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Ensure the drawer always opens scrolled to top
  useEffect(() => {
    if (!open) return;
    const t1 = window.setTimeout(scrollDrawerToTop, 0);
    const t2 = window.setTimeout(scrollDrawerToTop, 150);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [open, scrollDrawerToTop]);

  const parsedImportWords = useMemo(() => parseUserDictionaryImportText(importText), [importText]);
  const hasAnyWords = useMemo(() => userDictionaries.some((d) => d.words.length > 0), [userDictionaries]);

  const importUserWords = useCallback(async () => {
    const { next, createdDictionaryId } = mergeImportedWordsIntoUserDictionaries(
      userDictionaries,
      parsedImportWords,
      t('userDictionary.myDictionaryName')
    );
    if (next === userDictionaries) return;

    const first = next[0];
    setImporting(true);
    try {
      const createAndSave = async () => {
        const { id } = await createDictionary(first.name, first.words);
        setCookie(USER_DICTIONARY_ID_COOKIE, id);
        const nextWithId = next.map((d, i) => (i === 0 ? { ...d, id } : d));
        setUserDictionaries(nextWithId);
        onDictionaryCreated?.(id);
        onAfterImport?.(nextWithId);
        setImportText('');
      };

      if (isPersistedDictionaryId(first.id)) {
        try {
          await updateDictionary(first.id, { words: first.words });
          setUserDictionaries(next);
          if (createdDictionaryId && onDictionaryCreated) onDictionaryCreated(createdDictionaryId);
          if (onAfterImport) onAfterImport(next);
          setImportText('');
        } catch {
          // 404 or other error: dictionary missing in DB (e.g. stale cookie) — create new one
          await createAndSave();
        }
      } else {
        await createAndSave();
      }
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }, [
    userDictionaries,
    parsedImportWords,
    t,
    setUserDictionaries,
    onDictionaryCreated,
    onAfterImport,
    message,
  ]);

  const syncWordsToDb = useCallback(
    async (dictId: string, words: Word[]) => {
      if (!isPersistedDictionaryId(dictId)) return;
      try {
        await updateDictionary(dictId, { words });
      } catch {
        message.error('Failed to sync with server');
      }
    },
    [message]
  );

  const clearAllUserDictionaryWords = useCallback(() => {
    const toSync = userDictionaries.filter((d) => isPersistedDictionaryId(d.id));
    setUserDictionaries((prev) => prev.map((d) => ({ ...d, words: [] })));
    toSync.forEach((d) => syncWordsToDb(d.id, []));
  }, [userDictionaries, setUserDictionaries, syncWordsToDb]);

  const removeWord = useCallback(
    (dictId: string, wordIndex: number) => {
      setUserDictionaries((prev) =>
        prev.map((d) => {
          if (d.id !== dictId) return d;
          const newWords = d.words.filter((_, i) => i !== wordIndex);
          if (isPersistedDictionaryId(dictId)) syncWordsToDb(dictId, newWords);
          return { ...d, words: newWords };
        })
      );
    },
    [setUserDictionaries, syncWordsToDb]
  );

  return (
    <Drawer
      title={t('userDictionary.title')}
      placement="right"
      onClose={onClose}
      open={open}
      size={isMobile ? 'default' : 600}
      className="user-dictionary-drawer"
      afterOpenChange={(isOpen) => {
        if (isOpen) scrollDrawerToTop();
      }}
      extra={
        <Popconfirm
          title={t('userDictionary.clearConfirmTitle')}
          okText={t('userDictionary.clearConfirmOk')}
          cancelText={t('userDictionary.clearConfirmCancel')}
          onConfirm={clearAllUserDictionaryWords}
          disabled={!hasAnyWords}
        >
          <Button
            type="text"
            disabled={!hasAnyWords}
            style={{
              color: 'var(--purple-primary)',
            }}
          >
            {t('userDictionary.clear')}
          </Button>
        </Popconfirm>
      }
      styles={{
        header: {
          background: 'var(--background)',
          borderBottom: '1px solid var(--gray-border)',
          color: 'var(--foreground)',
        },
        body: {
          background: 'var(--background)',
          color: 'var(--foreground)',
        },
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="flex flex-col gap-2">
          <Input.TextArea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={t('userDictionary.importPlaceholder')}
            autoSize={{ minRows: 2 }}
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--input-border)',
              color: 'var(--foreground)',
            }}
          />
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center sm:justify-end">
            <Button
              type="primary"
              onClick={importUserWords}
              loading={importing}
              disabled={importing}
              className="w-full sm:w-auto"
              style={{
                backgroundColor: '#8b5cf6',
                borderColor: '#8b5cf6',
                color: '#ffffff',
              }}
            >
              {t('userDictionary.import')}
            </Button>
          </div>
        </div>

        {userDictionaries.length === 0 || userDictionaries.every(dict => dict.words.length === 0) ? (
          <Empty
            description={t('userDictionary.empty')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: '40px' }}
          >
            <Text type="secondary" style={{ fontSize: '14px', color: 'var(--gray-text)' }}>
              {t('userDictionary.addWordsHint')}
            </Text>
          </Empty>
        ) : (
          userDictionaries.map((dict) => (
            <div key={dict.id}>
              {dict.words.length === 0 ? (
                <Empty
                  description={t('userDictionary.noWordsInDict')}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ marginTop: '20px' }}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {dict.words.map((word, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-2 rounded-lg"
                      style={{
                        background: 'var(--gray-light)',
                        border: '1px solid var(--gray-border)',
                      }}
                    >
                      <span style={{ color: 'var(--foreground)' }}>
                        <strong>{word.article}</strong> {word.noun}
                        {word.translation && ` - ${word.translation}`}
                      </span>
                      <Button
                        type="text"
                        danger
                        size="small"
                        onClick={() => removeWord(dict.id, idx)}
                      >
                        {t('userDictionary.delete')}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Drawer>
  );
}
