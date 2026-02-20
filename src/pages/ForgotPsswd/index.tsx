import React, { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import AntigravityBackground from "../../shared/components/AntigravityBackground";
import { buildApiUrl } from "../../shared/lib/api";

const ForgotPsswdPage = () => {
    const [email, setEmail] = useState("");
    const [requestFeedback, setRequestFeedback] = useState<string | null>(null);
    const [requestError, setRequestError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRequestReset = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setRequestError(null);
        setRequestFeedback(null);

        if (!email.trim() || !email.includes("@")) {
            setRequestError("Enter a valid email.");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(buildApiUrl("/user/forgot-password"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() }),
            });

            if (response.ok) {
                setRequestFeedback("If the user exists, an e-mail was sent.");
                return;
            }

            if (response.status === 400) {
                setRequestError("E-mail is required.");
                return;
            }

            setRequestError("Could not send reset request. Please try again.");
        } catch {
            setRequestError("Connection error. Check API URL and try again.");
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
                        <h1 className="text-3xl font-semibold leading-tight text-[var(--sf-200)]">Forgot password</h1>
                        <p className="text-sm text-[var(--sf-300)]">
                            Enter your email and we will send a reset link.
                        </p>
                    </div>

                    <form onSubmit={handleRequestReset} className="mt-8 rounded-2xl border border-[var(--sf-700)] bg-[var(--sf-900)]/50 p-5">
                        <p className="text-xs text-[var(--sf-400)]">POST /api/user/forgot-password</p>

                        <div className="mt-4 space-y-2">
                            <label htmlFor="forgotEmail" className="text-sm text-[var(--sf-300)]">
                                Email address
                            </label>
                            <input
                                id="forgotEmail"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full rounded-xl border border-[var(--sf-700)] bg-[var(--sf-900)]/60 px-4 py-3 text-sm text-[var(--sf-200)] placeholder:text-[var(--sf-500)] outline-none transition focus:border-[var(--sf-300)] focus:ring-2 focus:ring-[var(--sf-400)]/40"
                            />
                        </div>

                        {requestError && (
                            <p className="mt-3 rounded-xl border border-rose-300/50 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                                {requestError}
                            </p>
                        )}
                        {requestFeedback && (
                            <p className="mt-3 rounded-xl border border-[var(--sf-600)] bg-[var(--sf-900)]/60 px-3 py-2 text-xs text-[var(--sf-300)]">
                                {requestFeedback}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="mt-4 w-full rounded-xl bg-[var(--sf-300)] px-4 py-3 text-sm font-semibold text-[var(--sf-900)] transition hover:bg-[var(--sf-200)] focus:outline-none focus:ring-2 focus:ring-[var(--sf-200)]/60"
                        >
                            {isSubmitting ? "Sending..." : "Send reset request"}
                        </button>
                    </form>

                    <div className="mt-6 flex items-center justify-between text-sm text-[var(--sf-300)]">
                        <Link to="/login" className="hover:text-[var(--sf-200)] transition">
                            Back to login
                        </Link>
                        <Link to="/signup" className="hover:text-[var(--sf-200)] transition">
                            Create account
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ForgotPsswdPage;
