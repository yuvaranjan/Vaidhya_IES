import Link from "next/link";

const NODE_ROLE = process.env.NEXT_PUBLIC_NODE_ROLE ?? "edge";

const entries = [
  {
    href: "/login",
    role: "edge",
    title: "Patient",
    body: "Phone + OTP. The nurse uses this session — there is no nurse account.",
  },
  {
    href: "/doctor/login",
    role: "central",
    title: "Doctor",
    body: "Phone + password. Queue, consult, prescribe.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 p-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Vaidhya</h1>
        <p className="mt-2 text-muted">
          Edge-AI telemedicine for rural primary care. This node is running as{" "}
          <span className="rounded-lg bg-primary-50 px-2 py-0.5 font-medium text-primary-700">
            {NODE_ROLE}
          </span>
          .
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {entries.map((e) => (
          <Link
            key={e.href}
            href={e.href}
            className="rounded-xl border border-border bg-surface p-6 transition-colors hover:border-primary-300"
          >
            <h2 className="text-lg font-medium">{e.title}</h2>
            <p className="mt-1 text-muted">{e.body}</p>
          </Link>
        ))}
      </div>

      <p className="text-sm text-muted">
        Demo credentials and setup: see the repo README.
      </p>
    </main>
  );
}
