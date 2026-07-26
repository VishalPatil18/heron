"use client";

import { useState } from "react";
import { motion } from "motion/react";

type NodeId =
  | "input"
  | "text"
  | "image"
  | "meta"
  | "concat"
  | "fusion"
  | "verdict";

interface Node {
  id: NodeId;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub: string;
  accent: string;
  desc: string;
  connects: NodeId[];
}

const H = 72;
const nodes: Node[] = [
  {
    id: "input",
    x: 25,
    y: 199,
    w: 150,
    h: H,
    title: "Email",
    sub: "text · logos · meta",
    accent: "var(--color-ink)",
    desc: "The raw email - subject, body, and any embedded or linked brand logos. Pasted text or an .html/.eml upload is parsed into text, images, and 20 engineered metadata features.",
    connects: ["text", "image", "meta"],
  },
  {
    id: "text",
    x: 255,
    y: 64,
    w: 210,
    h: H,
    title: "Text Tower",
    sub: "1-D CNN · 256-d",
    accent: "var(--color-brand-coral)",
    desc: "A custom 1-D CNN. An embedding layer feeds four conv blocks (64→128→256→512) with batch-norm, ReLU and max-pooling that learn urgency phrases and phishing language, projected to a 256-d vector. Alone it scores 98.96%.",
    connects: ["input", "concat"],
  },
  {
    id: "image",
    x: 255,
    y: 199,
    w: 210,
    h: H,
    title: "Image Tower",
    sub: "2-D CNN · 512-d",
    accent: "var(--color-brand-blue)",
    desc: "A custom VGG-style 2-D CNN over 224×224 logo crops. Four conv blocks (64→128→256→512) detect brand marks and logo–domain mismatches, producing a 512-d visual feature vector.",
    connects: ["input", "concat"],
  },
  {
    id: "meta",
    x: 255,
    y: 334,
    w: 210,
    h: H,
    title: "Metadata MLP",
    sub: "20 → 64-d",
    accent: "var(--color-brand-purple)",
    desc: "A small MLP that projects 20 engineered signals - URL counts, suspicious TLDs, sender/receiver domain mismatch, urgency keywords, caps and punctuation - into 64-d, catching cues pure text and image miss.",
    connects: ["input", "concat"],
  },
  {
    id: "concat",
    x: 545,
    y: 199,
    w: 150,
    h: H,
    title: "Concatenate",
    sub: "832-d",
    accent: "var(--color-ink)",
    desc: "The three feature vectors join into one 832-d multimodal representation (256 text + 512 image + 64 metadata).",
    connects: ["text", "image", "meta", "fusion"],
  },
  {
    id: "fusion",
    x: 760,
    y: 199,
    w: 195,
    h: H,
    title: "Fusion Classifier",
    sub: "832→512→256→128→2",
    accent: "var(--color-ink)",
    desc: "Four fully-connected layers (832→512→256→128→2) with batch-norm, ReLU and dropout. Learned fusion weights let the model lean on whichever modality is most reliable for each email.",
    connects: ["concat", "verdict"],
  },
  {
    id: "verdict",
    x: 1015,
    y: 199,
    w: 145,
    h: H,
    title: "Verdict",
    sub: "phishing vs legit + %",
    accent: "var(--color-brand-coral)",
    desc: "A softmax over the two classes gives phishing vs legitimate plus a 0–100% confidence - a graded score for triage and thresholding, not just a yes/no.",
    connects: ["fusion"],
  },
];

const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n])) as Record<
  NodeId,
  Node
>;

const edges: [NodeId, NodeId][] = [
  ["input", "text"],
  ["input", "image"],
  ["input", "meta"],
  ["text", "concat"],
  ["image", "concat"],
  ["meta", "concat"],
  ["concat", "fusion"],
  ["fusion", "verdict"],
];

function edgePath(from: Node, to: Node): string {
  const x1 = from.x + from.w;
  const y1 = from.y + from.h / 2;
  const x2 = to.x;
  const y2 = to.y + to.h / 2;
  const dx = (x2 - x1) * 0.5;
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

const edgeVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: { pathLength: 1, opacity: 1, transition: { duration: 0.5 } },
};
const nodeVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function ArchitectureDiagram() {
  const [hovered, setHovered] = useState<NodeId | null>(null);
  const [pinned, setPinned] = useState<NodeId | null>(null);
  const active = hovered ?? pinned;
  const activeNode = active ? nodeById[active] : null;

  function nodeState(id: NodeId): "active" | "connected" | "dim" | "idle" {
    if (!active) return "idle";
    if (id === active) return "active";
    return activeNode!.connects.includes(id) ? "connected" : "dim";
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <motion.svg
          viewBox="0 0 1185 470"
          className="w-full min-w-[900px]"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ staggerChildren: 0.07, delayChildren: 0.1 }}
          role="group"
          aria-label="Heron dual-tower fusion architecture"
        >
          {edges.map(([from, to]) => {
            const touches = active === from || active === to;
            return (
              <motion.path
                key={`${from}-${to}`}
                d={edgePath(nodeById[from], nodeById[to])}
                fill="none"
                variants={edgeVariants}
                className="transition-all duration-300"
                style={{
                  stroke: touches ? "var(--color-ink)" : "var(--color-muted)",
                  strokeWidth: touches ? 2.5 : 1.5,
                  opacity: !active ? 0.6 : touches ? 1 : 0.15,
                }}
              />
            );
          })}

          {nodes.map((n) => {
            const state = nodeState(n.id);
            const cx = n.x + n.w / 2;
            const cy = n.y + n.h / 2;
            return (
              <motion.g
                key={n.id}
                variants={nodeVariants}
                whileHover={{ scale: 1.03 }}
                style={{
                  transformBox: "fill-box",
                  transformOrigin: "center",
                  outline: "none",
                }}
                className="cursor-pointer outline-none focus:outline-none"
                role="button"
                tabIndex={0}
                aria-label={`${n.title}: ${n.sub}`}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(n.id)}
                onBlur={() => setHovered(null)}
                onClick={() => setPinned(n.id)}
              >
                <g
                  className="transition-opacity duration-300"
                  style={{ opacity: state === "dim" ? 0.4 : 1 }}
                >
                  <rect
                    x={n.x}
                    y={n.y}
                    width={n.w}
                    height={n.h}
                    rx={12}
                    fill="var(--color-canvas)"
                    className="transition-all duration-300"
                    style={{
                      stroke: n.accent,
                      strokeWidth:
                        state === "active"
                          ? 3
                          : state === "connected"
                            ? 2
                            : 1.5,
                      strokeDasharray: state === "connected" ? "6 5" : "none",
                    }}
                  />
                  <text
                    x={cx}
                    y={cy - 4}
                    textAnchor="middle"
                    className="fill-ink"
                    style={{ fontSize: 15, fontWeight: 600 }}
                  >
                    {n.title}
                  </text>
                  <text
                    x={cx}
                    y={cy + 15}
                    textAnchor="middle"
                    className="fill-steel"
                    style={{ fontSize: 11.5 }}
                  >
                    {n.sub}
                  </text>
                </g>
              </motion.g>
            );
          })}
        </motion.svg>
      </div>

      <div className="relative mt-6 min-h-[108px] rounded-xl border border-hairline p-5">
        {activeNode ? (
          <>
            <button
              type="button"
              aria-label="Clear selection"
              onClick={() => {
                setPinned(null);
                setHovered(null);
              }}
              className="absolute right-5 top-5 text-brand-coral cursor-pointer"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M6 6 L18 18" />
                <path d="M18 6 L6 18" />
              </svg>
            </button>
            <div className="flex items-center gap-2 pr-8">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: activeNode.accent }}
              />
              <h3 className="text-card-title text-ink">{activeNode.title}</h3>
              <span className="text-body-sm text-steel">{activeNode.sub}</span>
            </div>
            <p className="text-body-sm text-charcoal mt-2">{activeNode.desc}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-caption text-steel">Connects to</span>
              {activeNode.connects.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-hairline bg-surface px-2.5 py-0.5 text-caption text-charcoal"
                >
                  {nodeById[c].title}
                </span>
              ))}
            </div>
          </>
        ) : (
          <p className="text-body-sm text-steel">
            Hover or tap a block to see what it does and how it connects to the
            rest of the pipeline.
          </p>
        )}
      </div>
    </div>
  );
}
