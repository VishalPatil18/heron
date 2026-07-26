const team = [
  {
    name: "Akash S Vora",
    role: "Contributor",
    github: "https://github.com/akashsv01",
    linkedin: "https://www.linkedin.com/in/akash-s-vora/",
    image: "/akash.jpeg",
  },
  {
    name: "Srihari Narayan",
    role: "Contributor",
    github: "https://github.com/Srihari-Narayan",
    linkedin: "https://www.linkedin.com/in/srihari-narayan/",
    image: "/sri.jpeg",
  },
  {
    name: "Sai Anila Namburi",
    role: "Contributor",
    github: "https://github.com/madhu-anila",
    linkedin: "https://www.linkedin.com/in/anila-namburi/",
    image: "/anila.png",
  },
];

const skills = [
  "Spec-Driven Development",
  "Full-stack (Next.js · TypeScript)",
  "RAG & GenAI integrations",
  "Multi-provider LLM systems",
  "Postgres · Drizzle ORM",
];

const VAI = "https://v-ai.org/build";
const CNBC =
  "https://www.cnbc.com/2026/04/30/these-2-job-seekers-built-ai-chatbots-to-talk-to-recruiters-for-them.html";

const pillPrimary =
  "inline-flex items-center justify-center rounded-full text-button-md px-6 py-[10px] bg-ink text-canvas active:bg-charcoal transition-colors";
const pillSecondary =
  "inline-flex items-center justify-center rounded-full text-button-md px-6 py-[10px] bg-transparent text-ink border border-ink transition-colors";

export default function TeamPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16 lg:py-24">
      <span className="text-caption font-semibold uppercase tracking-[0.08em] text-brand-coral">
        Vishal & the Team
      </span>
      <div className="flex flex-col mt-6 items-center gap-6 sm:flex-row sm:items-start">
        <img
          src="/vishal.jpeg"
          alt="Vishal Patil"
          className="h-30 w-30 rounded-full object-cover"
        />
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            <span className="text-caption font-semibold text-brand-coral">
              Open to work · US &amp; Europe
            </span>
          </div>
          <h1 className="mt-3 text-heading-md font-bold text-ink">
            Hi, I&apos;m Vishal Patil
          </h1>
          <p className="text-[20px] font-semibold text-steel/80">
            I build AI products people actually use.
          </p>
        </div>
      </div>

      <p className="text-body-md text-steel mt-5 max-w-4xl text-justify">
        I&apos;m an AI engineer and researcher who ships end-to-end{" "}
        <a
          href={VAI}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-coral font-medium"
        >
          products
        </a>{" "}
        from specifications to production. My last project,{" "}
        <a
          href={VAI}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-coral font-medium"
        >
          VAi
        </a>
        , an AI assistant that talks to recruiters on a job seeker&apos;s
        behalf, went viral and was{" "}
        <a
          href={CNBC}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-coral font-medium"
        >
          featured by CNBC
        </a>
        . Heron is where that same instinct to take a hard model problem and
        turn it into something people can actually use, meets multimodal deep
        learning for phishing detection.
      </p>

      <div className="mt-8 rounded-xxxl border border-hairline p-6 max-w-4xl">
        <h3 className="text-body-md font-semibold text-ink">
          What I bring to the table
        </h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {skills.map((s) => (
            <span
              key={s}
              className="rounded-full border border-hairline px-2 py-1 text-[12px] text-charcoal"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <a href="mailto:hire.vishalpatil@gmail.com" className={pillPrimary}>
          Hire me
        </a>
        <a
          href="https://v-ai.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={pillSecondary}
        >
          Portfolio
        </a>
        <a
          href="https://www.linkedin.com/in/vishalrameshpatil/"
          target="_blank"
          rel="noopener noreferrer"
          className={pillSecondary}
        >
          LinkedIn
        </a>
        <a
          href="https://github.com/VishalPatil18"
          target="_blank"
          rel="noopener noreferrer"
          className={pillSecondary}
        >
          GitHub
        </a>
      </div>

      <h2 className="text-heading-sm text-ink mt-16">The rest of the team</h2>
      <div className="mt-6 max-w-4xl grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {team.map((m) => (
          <div
            key={m.name}
            className="flex flex-col rounded-xxxl border border-hairline p-4 transition shadow-md hover:shadow-lg"
          >
            <div className="flex items-center gap-3">
              <img
                src={m.image}
                alt={m.name}
                className="h-12 w-12 shrink-0 rounded-full object-cover"
              />
              <div>
                <h3 className="text-[16px] font-bold text-ink">{m.name}</h3>
                <p className="text-body-sm text-steel">{m.role}</p>
              </div>
            </div>

            <div className="mt-3 flex gap-2 w-full">
              <a
                href={m.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center rounded-full text-button-md px-4 py-1 bg-transparent text-ink border border-ink hover:bg-blue-700 hover:text-white hover:border-blue-700 transition duration-300"
              >
                LinkedIn
              </a>
              <a
                href={m.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center rounded-full text-button-md px-4 py-1 bg-transparent text-ink border border-ink hover:bg-gray-950 hover:text-white transition duration-300"
              >
                GitHub
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
