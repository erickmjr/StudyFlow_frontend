import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AntigravityBackground from "../../shared/components/AntigravityBackground";

type StoredUser = {
    id?: number;
    name?: string;
    email?: string;
    createdAt?: string;
};

const USER_STORAGE_KEY = "studyflow:user";

const readStoredUser = (): StoredUser => {
    if (typeof window === "undefined") {
        return {};
    }

    try {
        const rawValue = localStorage.getItem(USER_STORAGE_KEY);
        if (!rawValue) return {};
        const parsedValue = JSON.parse(rawValue) as StoredUser;
        return parsedValue ?? {};
    } catch {
        return {};
    }
};

const formatIsoDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("pt-BR");
};

const MyAccountPage = () => {
    const storedUser = useMemo(() => readStoredUser(), []);

    const [name, setName] = useState(storedUser.name ?? "");
    const [email, setEmail] = useState(storedUser.email ?? "");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFeedback(null);

        const trimmedName = name.trim();
        const trimmedEmail = email.trim();

        if (!trimmedName || !trimmedEmail) {
            setFeedback({ type: "error", text: "Nome e email sao obrigatorios." });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            setFeedback({ type: "error", text: "Informe um email valido." });
            return;
        }

        if (password && password.length < 8) {
            setFeedback({ type: "error", text: "A senha deve ter pelo menos 8 caracteres." });
            return;
        }

        if (password !== confirmPassword) {
            setFeedback({ type: "error", text: "As senhas nao conferem." });
            return;
        }

        setIsSubmitting(true);

        const updatedUser: StoredUser = {
            ...storedUser,
            name: trimmedName,
            email: trimmedEmail,
            createdAt: storedUser.createdAt ?? new Date().toISOString(),
        };

        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));

        setPassword("");
        setConfirmPassword("");
        setFeedback({
            type: "success",
            text: "Informacoes salvas localmente.",
        });
        setIsSubmitting(false);
    };

    return (
        <section className="relative h-screen overflow-hidden bg-[var(--sf-900)] text-[var(--sf-200)]">
            <AntigravityBackground className="absolute inset-0 opacity-90" />
            <div className="relative z-10 flex h-screen items-center justify-center px-4 py-4 sm:px-6">
                <div className="w-full max-w-xl rounded-3xl border border-[var(--sf-700)] bg-[linear-gradient(180deg,var(--sf-800)_0%,var(--sf-900)_100%)] p-6 shadow-[0_40px_90px_-50px_var(--sf-900)] backdrop-blur-xl">
                    <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.35em] text-[var(--sf-400)]">
                            StudyFlow
                        </p>
                        <h1 className="text-2xl font-semibold leading-tight text-[var(--sf-200)]">
                            My account
                        </h1>
                        <p className="text-sm text-[var(--sf-300)]">
                            Atualize seus dados pessoais.
                        </p>
                    </div>

                    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label htmlFor="id" className="text-sm text-[var(--sf-300)]">
                                    User ID
                                </label>
                                <input
                                    id="id"
                                    type="text"
                                    value={storedUser.id ?? "-"}
                                    readOnly
                                    className="w-full rounded-xl border border-[var(--sf-700)] bg-[var(--sf-900)]/40 px-4 py-3 text-sm text-[var(--sf-400)] outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="createdAt" className="text-sm text-[var(--sf-300)]">
                                    Account created at
                                </label>
                                <input
                                    id="createdAt"
                                    type="text"
                                    value={formatIsoDate(storedUser.createdAt)}
                                    readOnly
                                    className="w-full rounded-xl border border-[var(--sf-700)] bg-[var(--sf-900)]/40 px-4 py-3 text-sm text-[var(--sf-400)] outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm text-[var(--sf-300)]">
                                Full name
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder="Your full name"
                                className="w-full rounded-xl border border-[var(--sf-700)] bg-[var(--sf-900)]/60 px-4 py-3 text-sm text-[var(--sf-200)] placeholder:text-[var(--sf-500)] outline-none transition focus:border-[var(--sf-300)] focus:ring-2 focus:ring-[var(--sf-400)]/40"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm text-[var(--sf-300)]">
                                Email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="you@example.com"
                                className="w-full rounded-xl border border-[var(--sf-700)] bg-[var(--sf-900)]/60 px-4 py-3 text-sm text-[var(--sf-200)] placeholder:text-[var(--sf-500)] outline-none transition focus:border-[var(--sf-300)] focus:ring-2 focus:ring-[var(--sf-400)]/40"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="space-y-2 min-w-0">
                                <label htmlFor="password" className="text-sm text-[var(--sf-300)]">
                                    New password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="Optional"
                                    className="w-full rounded-xl border border-[var(--sf-700)] bg-[var(--sf-900)]/60 px-4 py-3 text-sm text-[var(--sf-200)] placeholder:text-[var(--sf-500)] outline-none transition focus:border-[var(--sf-300)] focus:ring-2 focus:ring-[var(--sf-400)]/40"
                                />
                            </div>
                            <div className="space-y-2 min-w-0">
                                <label htmlFor="confirmPassword" className="text-sm text-[var(--sf-300)]">
                                    Confirm password
                                </label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(event) => setConfirmPassword(event.target.value)}
                                    placeholder="Optional"
                                    className="w-full rounded-xl border border-[var(--sf-700)] bg-[var(--sf-900)]/60 px-4 py-3 text-sm text-[var(--sf-200)] placeholder:text-[var(--sf-500)] outline-none transition focus:border-[var(--sf-300)] focus:ring-2 focus:ring-[var(--sf-400)]/40"
                                />
                            </div>
                        </div>

                        {feedback && (
                            <p
                                className={
                                    feedback.type === "success"
                                        ? "rounded-xl border border-emerald-300/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
                                        : "rounded-xl border border-rose-300/50 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
                                }
                            >
                                {feedback.text}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full rounded-xl bg-[var(--sf-300)] px-4 py-3 text-sm font-semibold text-[var(--sf-900)] transition hover:bg-[var(--sf-200)] focus:outline-none focus:ring-2 focus:ring-[var(--sf-200)]/60 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isSubmitting ? "Saving..." : "Save changes"}
                        </button>
                    </form>

                    <div className="mt-6 flex items-center justify-center text-sm text-[var(--sf-300)]">
                        <p>
                            Need to sign in with another account?{" "}
                            <Link to="/login" className="text-[var(--sf-300)] transition hover:text-[var(--sf-200)]">
                                Back to login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MyAccountPage;
