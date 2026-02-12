import React from "react";
import AntigravityBackground from "../../shared/components/AntigravityBackground";

const LoginPage = () => {
    return (
        <section className="relative min-h-screen overflow-hidden bg-[var(--sf-900)] text-[var(--sf-200)]">
            <AntigravityBackground className="absolute inset-0 opacity-90" />
            <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16">
                <div className="w-full max-w-md rounded-3xl border border-[var(--sf-700)] bg-[linear-gradient(180deg,var(--sf-800)_0%,var(--sf-900)_100%)] p-8 shadow-[0_40px_90px_-50px_var(--sf-900)] backdrop-blur-xl">
                    <div className="space-y-3">
                        <p className="text-xs uppercase tracking-[0.35em] text-[var(--sf-400)]">
                            StudyFlow
                        </p>
                        <h1 className="text-3xl font-semibold leading-tight text-[var(--sf-200)]">
                            Welcome back
                        </h1>
                        <p className="text-sm text-[var(--sf-300)]">
                            Sign in to keep your focus sessions organized.
                        </p>
                    </div>

                    <form className="mt-8 space-y-5">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm text-[var(--sf-300)]">
                                Email address
                            </label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                placeholder="you@example.com"
                                className="w-full rounded-xl border border-[var(--sf-700)] bg-[var(--sf-900)]/60 px-4 py-3 text-sm text-[var(--sf-200)] placeholder:text-[var(--sf-500)] outline-none transition focus:border-[var(--sf-300)] focus:ring-2 focus:ring-[var(--sf-400)]/40"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm text-[var(--sf-300)]">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                id="password"
                                placeholder="Enter your password"
                                className="w-full rounded-xl border border-[var(--sf-700)] bg-[var(--sf-900)]/60 px-4 py-3 text-sm text-[var(--sf-200)] placeholder:text-[var(--sf-500)] outline-none transition focus:border-[var(--sf-300)] focus:ring-2 focus:ring-[var(--sf-400)]/40"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-xl bg-[var(--sf-300)] px-4 py-3 text-sm font-semibold text-[var(--sf-900)] transition hover:bg-[var(--sf-200)] focus:outline-none focus:ring-2 focus:ring-[var(--sf-200)]/60"
                        >
                            Log in
                        </button>
                    </form>

                    <div className="mt-6 flex items-center justify-between text-sm text-[var(--sf-300)]">
                        <a href="#" className="hover:text-[var(--sf-200)] transition">
                            Forgot password?
                        </a>
                        <a href="#" className="text-[var(--sf-300)] hover:text-[var(--sf-200)] transition">
                            Create account
                        </a>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default LoginPage;
