import Link from "next/link";
import { HeronLogo } from "./HeronLogo";

const columns = [
  {
    title: "Research",
    links: [
      { label: "The paper", href: "/research" },
      { label: "Benchmarks", href: "/benchmarks" },
      { label: "Architecture", href: "/architecture" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Team", href: "/team" },
      { label: "Hire Vishal", href: "mailto:hire.vishalpatil@gmail.com" },
      { label: "VAi", href: "https://v-ai.org/" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-footer-bg text-canvas">
      <div className="mx-auto max-w-[1280px] px-8 py-16">
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          <div className="max-w-xs space-y-3">
            <HeronLogo tagline />
            <br />
            <a
              href="https://github.com/VishalPatil18/heron"
              target="_blank"
              rel="noopener noreferrer"
              className="text-body-sm text-muted inline-block"
            >
              GitHub ↗
            </a>
            <br />
            <a
              href="https://huggingface.co/vishalpatil-18/heron-phishing"
              target="_blank"
              rel="noopener noreferrer"
              className="text-body-sm text-muted inline-block"
            >
              Hugging Face ↗
            </a>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.title} className="space-y-3">
                <h3 className="text-body-sm font-medium">{col.title}</h3>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-body-sm text-muted">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <p className="text-micro text-muted mt-12">
          © {new Date().getFullYear()} Heron - a multimodal phishing-detection
          system.
        </p>
      </div>
    </footer>
  );
}
