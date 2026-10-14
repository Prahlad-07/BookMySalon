/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-08-31
 *
 * Accessible confirmation dialog for destructive or irreversible actions.
 */
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import { useT } from '../i18n';

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = 'danger',
  busy = false,
  onConfirm,
  onCancel,
}) {
  const t = useT();
  const confirmRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocused.current = document.activeElement;
    const timer = window.setTimeout(() => confirmRef.current?.focus(), 0);

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) {
        onCancel?.();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      if (previouslyFocused.current instanceof HTMLElement) {
        previouslyFocused.current.focus();
      }
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-4 backdrop-blur-[2px] sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel?.();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="w-full max-w-[420px] animate-fade rounded-lg border border-line bg-surface p-6 shadow-pop"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="confirm-dialog-title" className="display text-[22px] leading-tight text-ink">
            {title}
          </h2>
          <button type="button" className="icon-btn -mr-2 -mt-1" onClick={() => !busy && onCancel?.()} aria-label={t('dialog.close')}>
            <X size={17} />
          </button>
        </div>
        {description && (
          <p id="confirm-dialog-description" className="mt-2 text-[15px] leading-relaxed text-ink-2">
            {description}
          </p>
        )}

        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={() => !busy && onCancel?.()} disabled={busy}>
            {cancelLabel || t('dialog.keep')}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={tone === 'danger' ? 'btn-danger-solid' : 'btn-dark'}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? t('dialog.working') : confirmLabel || t('dialog.confirm')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  tone: PropTypes.oneOf(['danger', 'primary']),
  busy: PropTypes.bool,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
