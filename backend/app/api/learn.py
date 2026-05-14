"""Mokshly Learn — 5S Framework content delivery."""

from __future__ import annotations

from dataclasses import dataclass
from functools import cache
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel as PydanticModel

router = APIRouter(prefix="/learn", tags=["learn"])


@dataclass(frozen=True)
class Module:
    slug: str
    title: str
    subtitle: str
    order: int
    file: str


MODULES: tuple[Module, ...] = (
    Module("welcome", "Welcome to YouSourceful", "Why we begin here.", 0, "00-welcome.md"),
    Module("source", "S1 — Source", "Who you truly are.", 1, "01-s1-source.md"),
    Module("seed", "S2 — Seed", "Thought as pattern.", 2, "02-s2-seed.md"),
    Module("soil", "S3 — Soil", "Patterns meeting the world.", 3, "03-s3-soil.md"),
    Module("seasons", "S4 — Seasons", "Time, unfolding, and alignment.", 4, "04-s4-seasons.md"),
    Module("sowing", "S5 — Sowing", "Conscious choice and living well.", 5, "05-s5-sowing.md"),
    Module(
        "bridge",
        "From Understanding to Living",
        "Bridge into the 7 Practices.",
        6,
        "06-from-understanding-to-living.md",
    ),
)

_BY_SLUG = {m.slug: m for m in MODULES}


@cache
def _content_root() -> Path:
    return Path(__file__).resolve().parents[3] / "content" / "learn"


class ModuleSummary(PydanticModel):
    slug: str
    title: str
    subtitle: str
    order: int


class ModuleDetail(ModuleSummary):
    content: str


@router.get("", response_model=list[ModuleSummary])
async def list_modules() -> list[ModuleSummary]:
    return [
        ModuleSummary(slug=m.slug, title=m.title, subtitle=m.subtitle, order=m.order)
        for m in MODULES
    ]


@router.get("/{slug}", response_model=ModuleDetail)
async def get_module(slug: str) -> ModuleDetail:
    module = _BY_SLUG.get(slug)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    path = _content_root() / module.file
    content = path.read_text(encoding="utf-8") if path.exists() else ""
    return ModuleDetail(
        slug=module.slug,
        title=module.title,
        subtitle=module.subtitle,
        order=module.order,
        content=content,
    )
