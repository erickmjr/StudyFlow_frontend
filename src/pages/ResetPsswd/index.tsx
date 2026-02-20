import React, { useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AntigravityBackground from "../../shared/components/AntigravityBackground";
import { buildApiUrl } from "../../shared/lib/api";

const ResetPsswdPage = () => {
    const [searchParams] = useSearchParams();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const tokenInPath = (searchParams.get("token") ?? "").trim();

    const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setFeedback(null);

        if (!tokenInPath) {
            setError("Reset token is missing in URL.");
            return;
        }
        if (newPassword.length < 8) {
            setError("Password must have at least 8 characters.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Password and confirmation must match.");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(buildApiUrl("/user/reset-password"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token: tokenInPath,
                    newPassword,
                }),
            });

            if (response.ok) {
                setFeedback("Password updated successfully.");
                setNewPassword("");
                setConfirmPassword("");
                return;
            }

            if (response.status === 400) {
                setError("Invalid reset data. Check token and password rules.");
                return;
            }
            if (response.status === 401) {
                setError("Token expired or invalid. Request a new reset link.");
                return;
            }
            if (response.status === 404) {
                setError("User not found for this token.");
                return;
            }

            setError("Could not reset password. Please try again.");
        } catch {
            setError("Connection error. Check API URL and try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="relative min-h-screen overflow-hidden bg-[var(--sf-900)] text-[var(--sf-200)]">
            <AntigravityBackground className="absolute inset-0 opacity-90" />

            <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10">
                <div className="w-full max-w-md rounded-3xl border border-[var(--sf-700)] bg-[linear-gradient(180deg,var(--sf-800)_0%,var(--sf-900)_100%)] p-8 shadow-[0_40px_90px_-50px_var(--sf-900)] backdrop-blur-xl">
                    <div className="space-y-3">
                        <p className="text-xs uppercase tracking-[0.35em] text-[var(--sf-400)]">StudyFlow</p>
                        <h1 className="text-3xl font-semibold leading-tight text-[var(--sf-200)]">Reset password</h1>
                        <p className="text-sm text-[var(--sf-300)]">
                            Create a new password for your account.
                        </p>
                    </div>

                    <form onSubmit={handleResetPassword} className="mt-8 rounded-2xl border border-[var(--sf-700)] bg-[var(--sf-900)]/50 p-5">
                        <p className="text-xs text-[var(--sf-400)]">POST /api/user/reset-password</p>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="space-y-2 min-w-0">
                                <label htmlFor="newPassword" className="text-sm text-[var(--sf-300)]">
                                    New password
                                </label>
                                <input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="At least 8 chars"
                                    className="w-full rounded-xl border border-[var(--sf-700)] bg-[var(--sf-900)]/60 px-4 py-3 text-sm text-[var(--sf-200)] placeholder:text-[var(--sf-500)] outline-none transition focus:border-[var(--sf-300)] focus:ring-2 focus:ring-[var(--sf-400)]/40"
                                />
                            </div>
                            <div className="space-y-2 min-w-0">
                                <label htmlFor="confirmNewPassword" className="text-sm text-[var(--sf-300)]">
                                    Confirm
                                </label>
                                <input
                                    id="confirmNewPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm password"
                                    className="w-full rounded-xl border border-[var(--sf-700)] bg-[var(--sf-900)]/60 px-4 py-3 text-sm text-[var(--sf-200)] placeholder:text-[var(--sf-500)] outline-none transition focus:border-[var(--sf-300)] focus:ring-2 focus:ring-[var(--sf-400)]/40"
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="mt-3 rounded-xl border border-rose-300/50 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                                {error}
                            </p>
                        )}
                        {feedback && (
                            <p className="mt-3 rounded-xl border border-emerald-300/50 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                                {feedback}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="mt-4 w-full rounded-xl bg-[var(--sf-300)] px-4 py-3 text-sm font-semibold text-[var(--sf-900)] transition hover:bg-[var(--sf-200)] focus:outline-none focus:ring-2 focus:ring-[var(--sf-200)]/60"
                        >
                            {isSubmitting ? "Resetting..." : "Reset password"}
                        </button>
                    </form>

                    <div className="mt-6 flex items-center justify-between text-sm text-[var(--sf-300)]">
                        <Link to="/forgot-password" className="hover:text-[var(--sf-200)] transition">
                            Request reset again
                        </Link>
                        <Link to="/login" className="hover:text-[var(--sf-200)] transition">
                            Back to login
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ResetPsswdPage;
