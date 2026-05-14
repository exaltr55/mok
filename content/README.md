# Mokshly Content Library

This folder is the **canonical reference text** for content that users encounter inside Mokshly. It is the source-of-truth archive — the actual app may render this content from a headless CMS (Sanity is the leading candidate per [content-delivery.md](../docs/03-systems/content-delivery.md)), but the .md files here are the authoritative copy.

## Folder map

```
content/
├── README.md                  ← you are here
├── learn/                     ← Mokshly Learn — the 5S Framework
│   ├── README.md
│   ├── 00-welcome.md
│   ├── 01-s1-source.md
│   ├── 02-s2-seed.md
│   ├── 03-s3-soil.md
│   ├── 04-s4-seasons.md
│   ├── 05-s5-sowing.md
│   └── 06-from-understanding-to-living.md
└── do/                        ← Mokshly Do — the 7 Practices
    ├── README.md
    ├── 00-introduction.md
    ├── 01-breathing.md
    ├── 02-thinking.md
    ├── 03-talking.md
    ├── 04-writing.md
    ├── 05-moving.md
    ├── 06-resetting.md
    └── 07-aligning.md
```

Future content trees will include:

- `content/cohort-prompts/` — the 52+ weekly cohort prompts.
- `content/ai-guide/` — message library for the AI Guide trigger moments.
- `content/newsletter/` — Mokshly Weekly issues.
- `content/onboarding/` — onboarding microcopy.

## Formatting conventions

- **Preserve the original cadence.** Most content is written with breath-paced line breaks meant for audio narration. We keep that rhythm using markdown soft-breaks (two trailing spaces) within stanzas, and blank lines between stanzas.
- **Voice is canonical.** Don't paraphrase. If wording feels off, raise it with the Content Curator rather than editing in place.
- **Versioning.** Major edits should bump a header version comment at the top of the affected file. Once content is loaded into the CMS, the CMS version becomes authoritative; this archive remains the readable backup.

## Where this content is delivered

| Content area | Delivered in | Spec doc |
|--------------|--------------|----------|
| 5S Framework (`learn/`) | Mokshly Learn pillar | [02-pillars/learn.md](../docs/02-pillars/learn.md) |
| 7 Practices (`do/`) | Mokshly Do pillar | [02-pillars/do.md](../docs/02-pillars/do.md) |
| Cohort prompts | Weekly Connect | [02-pillars/connect.md](../docs/02-pillars/connect.md) |
| AI Guide messages | AI Guide check-ins | [02-pillars/ai-guide.md](../docs/02-pillars/ai-guide.md) |
| Newsletter | Mokshly Weekly | [02-pillars/weekly-newsletter.md](../docs/02-pillars/weekly-newsletter.md) |
