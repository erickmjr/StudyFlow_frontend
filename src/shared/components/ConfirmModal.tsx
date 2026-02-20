import React from "react";
import { AnimatePresence, motion } from "framer-motion";

type ConfirmModalProps = {
    isOpen: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    danger?: boolean;
};

const ConfirmModal = ({
    isOpen,
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    onConfirm,
    onCancel,
    danger = false,
}: ConfirmModalProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--sf-900)]/70 px-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onCancel}
                >
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label={title}
                        className="w-full max-w-md rounded-2xl border border-[var(--sf-700)] bg-[linear-gradient(180deg,var(--sf-800)_0%,var(--sf-900)_100%)] p-5 shadow-[0_40px_90px_-50px_var(--sf-900)]"
                        initial={{ opacity: 0, y: 10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <h2 className="text-lg font-semibold text-[var(--sf-200)]">{title}</h2>
                        {description && <p className="mt-2 text-sm text-[var(--sf-300)]">{description}</p>}

                        <div className="mt-5 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="rounded-xl border border-[var(--sf-600)] bg-[var(--sf-800)]/70 px-3.5 py-2 text-sm text-[var(--sf-300)] transition hover:text-[var(--sf-200)]"
                            >
                                {cancelLabel}
                            </button>
                            <button
                                type="button"
                                onClick={onConfirm}
                                className={
                                    danger
                                        ? "rounded-xl border border-rose-300/40 bg-rose-500/20 px-3.5 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/30"
                                        : "rounded-xl bg-[var(--sf-300)] px-3.5 py-2 text-sm font-semibold text-[var(--sf-900)] transition hover:bg-[var(--sf-200)]"
                                }
                            >
                                {confirmLabel}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmModal;
