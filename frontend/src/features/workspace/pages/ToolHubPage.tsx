// Workspace landing page that acts as the app's tool chooser.
import { ArrowRight, ArrowUpRight, BarChart3, Link2, LogOut, Microscope, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ToolHubPage() {
    const navigate = useNavigate();
    const username = localStorage.getItem("username");

    const handleSignOut = () => {
        localStorage.removeItem("user_id");
        localStorage.removeItem("username");
        navigate("/");
    };

    return (
        <div
            className="relative min-h-screen overflow-hidden px-6 py-8 md:px-10"
            style={{
                background:
                    "linear-gradient(180deg, #ffffff 0%, #f8fbff 24%, #eaf5ff 60%, #d5eafe 100%), #f6fbff",
            }}
        >
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                <div className="absolute -top-24 left-[-120px] h-[360px] w-[360px] rounded-full bg-[rgba(35,171,248,0.15)] blur-3xl" />
                <div className="absolute bottom-[-140px] right-[-100px] h-[320px] w-[320px] rounded-full bg-[rgba(255,195,23,0.14)] blur-3xl" />
            </div>

            <div className="relative mx-auto flex max-w-6xl flex-col gap-8">
                <header className="flex flex-col gap-6 rounded-3xl border border-[rgba(35,171,248,0.18)] bg-white/90 p-8 shadow-[0_24px_70px_rgba(14,76,113,0.1)] backdrop-blur md:flex-row md:items-end md:justify-between">
                    <div className="max-w-3xl">
                        <img
                            src="/logo/logo.png"
                            alt="ClassEcho"
                            className="mb-5 h-14 w-auto drop-shadow-[0_10px_18px_rgba(14,76,113,0.14)]"
                        />
                        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[rgba(255,195,23,0.18)] px-4 py-2 text-sm font-medium text-[var(--brand-navy)]">
                            <Sparkles className="h-4 w-4" />
                            {username ? `Hi, ${username}` : "Hi there"}
                        </p>
                        <h1 className="text-3xl font-semibold text-[var(--brand-navy)] md:text-4xl">
                            Welcome to ClassEcho.
                        </h1>
                        <p className="mt-3 text-base text-[var(--text-muted)] md:text-lg">
                            Use Observation Mode to record classroom observations, or switch to Visualization Mode to review patterns, results, and trends.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleSignOut}
                        className="inline-flex items-center gap-2 self-start rounded-full border border-[rgba(55,157,234,0.18)] px-4 py-2 text-sm font-medium text-[var(--brand-navy)] transition hover:border-[rgba(255,195,23,0.34)] hover:bg-[rgba(255,255,255,0.96)]"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign out
                    </button>
                </header>

                <section
                    className="grid gap-4 rounded-[1.75rem] border border-[rgba(35,171,248,0.2)] p-5 shadow-[0_18px_42px_rgba(14,76,113,0.08)] md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center"
                    style={{
                        background:
                            "radial-gradient(circle at 16% 28%, rgba(35,171,248,0.16), transparent 34%), radial-gradient(circle at 84% 70%, rgba(255,195,23,0.18), transparent 32%), linear-gradient(135deg, rgba(236,247,255,0.98) 0%, rgba(245,251,255,0.98) 54%, rgba(255,247,227,0.98) 100%)",
                    }}
                >
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(35,171,248,0.12)] text-[var(--brand-navy)]">
                        <Link2 className="h-6 w-6" />
                    </div>

                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-[var(--brand-navy)]">
                            Optional SnapClass connection
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-[var(--text-muted)] md:text-[0.96rem]">
                            SnapClass is a classroom management tool for student Snap! coding. When used together, ClassEcho can show student code snapshots and emoji reactions in the Visualization Mode along with your observation logs. You can still use ClassEcho without SnapClass.
                        </p>
                    </div>

                    <a
                        href="https://lin-class17.csc.ncsu.edu/snapclass/"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 self-start rounded-[1rem] border border-[rgba(35,171,248,0.18)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--brand-navy)] shadow-[0_12px_26px_rgba(14,76,113,0.08)] transition hover:-translate-y-[1px] hover:border-[rgba(35,171,248,0.32)] hover:bg-[rgba(255,255,255,0.98)] md:self-center"
                    >
                        Open SnapClass
                        <ArrowUpRight className="h-4 w-4" />
                    </a>
                </section>

                <section className="grid gap-6 lg:grid-cols-2">
                    <button
                        type="button"
                        onClick={() => navigate("/session-options")}
                        className="group flex h-full flex-col rounded-3xl border border-[rgba(55,157,234,0.18)] bg-white p-8 text-left shadow-[0_24px_60px_rgba(14,76,113,0.08)] transition hover:-translate-y-1 hover:border-[rgba(255,195,23,0.34)] hover:shadow-[0_30px_70px_rgba(14,76,113,0.12)]"
                    >
                        <div>
                            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(255,195,23,0.18)] text-[var(--brand-navy)]">
                                <Microscope className="h-7 w-7" />
                            </div>
                        </div>

                        <div className="mt-8">
                            <h2 className="text-2xl font-semibold text-[var(--brand-navy)]">Observation Mode</h2>
                            <p className="mt-3 text-base leading-7 text-[var(--text-muted)]">
                                Create sessions, join live observations, record observations, and manage previous work from one place.
                            </p>
                        </div>

                        <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-navy)]">
                            Open Observation Mode
                            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/visualization")}
                        className="group flex h-full flex-col rounded-3xl border border-[rgba(55,157,234,0.18)] bg-white p-8 text-left shadow-[0_24px_60px_rgba(14,76,113,0.08)] transition hover:-translate-y-1 hover:border-[rgba(255,195,23,0.34)] hover:shadow-[0_30px_70px_rgba(14,76,113,0.12)]"
                    >
                        <div>
                            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(35,171,248,0.14)] text-[var(--brand-navy)]">
                                <BarChart3 className="h-7 w-7" />
                            </div>
                        </div>

                        <div className="mt-8">
                            <h2 className="text-2xl font-semibold text-[var(--brand-navy)]">Visualization Mode</h2>
                            <p className="mt-3 text-base leading-7 text-[var(--text-muted)]">
                                Review observation data, explore patterns over time, and turn your session results into something easier to understand.
                            </p>
                        </div>

                        <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-navy)]">
                            Explore Visualization Mode
                            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                        </div>
                    </button>
                </section>
            </div>
        </div>
    );
}
