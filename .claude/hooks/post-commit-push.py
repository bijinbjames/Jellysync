#!/usr/bin/env python3
"""
Claude Code PostToolUse hook — fires after Bash tool use.
Updates CLAUDE.md sprint status and recent changes when git commit or push is run.
Also updates the Claude memory file for this project.
"""

import sys
import json
import re
import subprocess
from pathlib import Path
from datetime import date

PROJECT_ROOT = Path("/mnt/256/myapp")
CLAUDE_MD = PROJECT_ROOT / "CLAUDE.md"
SPRINT_YAML = PROJECT_ROOT / "_bmad-output/implementation-artifacts/sprint-status.yaml"
MEMORY_DIR = Path("/home/bijin/.claude/projects/-mnt-256-myapp/memory")
MEMORY_FILE = MEMORY_DIR / "project_sprint_status.md"


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    tool_name = data.get("tool_name", "")
    tool_input = data.get("tool_input", {})
    command = tool_input.get("command", "") if isinstance(tool_input, dict) else ""

    # Only act on git commit or git push
    if tool_name != "Bash":
        sys.exit(0)
    if not ("git commit" in command or "git push" in command):
        sys.exit(0)

    # --- Gather data ---
    recent_commits = get_recent_commits()
    sprint_status = parse_sprint_status()

    # --- Update CLAUDE.md ---
    update_claude_md(recent_commits, sprint_status)

    # --- Update memory file ---
    update_memory_file(recent_commits, sprint_status)


def get_recent_commits(n=8):
    result = subprocess.run(
        ["git", "-C", str(PROJECT_ROOT), "log", "--oneline",
         "--format=%h %ad %s", "--date=short", f"-{n}"],
        capture_output=True, text=True
    )
    lines = [line.strip() for line in result.stdout.strip().splitlines() if line.strip()]
    return lines


def parse_sprint_status():
    """Parse sprint-status.yaml into epic summary and story lists."""
    if not SPRINT_YAML.exists():
        return None

    content = SPRINT_YAML.read_text()
    epics = {}
    epic_order = [1, 2, 3, 4, 5, 6]
    epic_titles = {
        1: "Project Foundation & Authentication",
        2: "Room Creation & Joining",
        3: "Library Browsing & Movie Selection",
        4: "Synchronized Playback",
        5: "Voice Chat & Audio",
        6: "Cross-Platform Polish & Deployment",
    }

    for line in content.splitlines():
        line = line.strip()
        if line.startswith("#") or not line or ":" not in line:
            continue
        key, _, val = line.partition(":")
        key = key.strip()
        val = val.strip()

        for n in epic_order:
            if key == f"epic-{n}":
                epics[n] = {"status": val, "done": [], "backlog": []}
            elif key.startswith(f"{n}-") and val in ("done", "backlog", "in-progress", "ready-for-dev"):
                epics.setdefault(n, {"status": "unknown", "done": [], "backlog": []})
                if val == "done":
                    epics[n]["done"].append(key)
                else:
                    epics[n]["backlog"].append(key)

    all_done = []
    all_backlog = []
    for n in epic_order:
        e = epics.get(n, {})
        all_done.extend(e.get("done", []))
        all_backlog.extend(e.get("backlog", []))

    return {
        "epics": epics,
        "epic_titles": epic_titles,
        "epic_order": epic_order,
        "all_done": all_done,
        "all_backlog": all_backlog,
        "today": str(date.today()),
    }


def build_sprint_section(sprint):
    if not sprint:
        return "_(sprint status unavailable)_"

    status_icon = {"done": "✅", "in-progress": "🔄", "backlog": "⏳", "unknown": "❓"}
    rows = []
    for n in sprint["epic_order"]:
        e = sprint["epics"].get(n, {"status": "backlog"})
        icon = status_icon.get(e["status"], "❓")
        title = sprint["epic_titles"].get(n, f"Epic {n}")
        rows.append(f"| {n} | {title} | {icon} {e['status']} |")

    table = "| Epic | Title | Status |\n|------|-------|--------|\n" + "\n".join(rows)
    done_str = ", ".join(sprint["all_done"]) if sprint["all_done"] else "none"
    backlog_str = ", ".join(sprint["all_backlog"]) if sprint["all_backlog"] else "none"

    return (
        f"{table}\n\n"
        f"**Stories done:** {done_str}\n"
        f"**Stories backlog:** {backlog_str}"
    )


def build_changes_section(commits):
    if not commits:
        return "_(no recent commits)_"
    lines = [f"- `{c}`" for c in commits]
    return "\n".join(lines)


def replace_between(text, start_marker, end_marker, new_content):
    """Replace content between two markers (inclusive of lines containing them)."""
    # Find the section header line (contains the start_marker comment)
    pattern = re.compile(
        r'(<!-- ' + re.escape(start_marker) + r' -->).*?(<!-- ' + re.escape(end_marker) + r' -->)',
        re.DOTALL
    )
    replacement = f"<!-- {start_marker} -->\n{new_content}\n<!-- {end_marker} -->"
    new_text, count = pattern.subn(replacement, text)
    if count == 0:
        # Markers not found, append at end
        new_text = text + f"\n<!-- {start_marker} -->\n{new_content}\n<!-- {end_marker} -->\n"
    return new_text


def update_claude_md(commits, sprint):
    if not CLAUDE_MD.exists():
        return

    content = CLAUDE_MD.read_text()

    # Update sprint section
    sprint_content = build_sprint_section(sprint)
    content = replace_between(content, "SPRINT_STATUS_START", "SPRINT_STATUS_END", sprint_content)

    # Update recent changes section
    changes_content = build_changes_section(commits)
    content = replace_between(content, "RECENT_CHANGES_START", "RECENT_CHANGES_END", changes_content)

    CLAUDE_MD.write_text(content)


def update_memory_file(commits, sprint):
    MEMORY_DIR.mkdir(parents=True, exist_ok=True)

    if not sprint:
        return

    today = sprint["today"]
    status_icon = {"done": "✅", "in-progress": "🔄", "backlog": "⏳"}

    epic_lines = []
    for n in sprint["epic_order"]:
        e = sprint["epics"].get(n, {"status": "backlog"})
        icon = status_icon.get(e["status"], "⏳")
        title = sprint["epic_titles"].get(n, f"Epic {n}")
        epic_lines.append(f"- Epic {n} ({title}): {icon} {e['status']}")

    done_count = len(sprint["all_done"])
    backlog_count = len(sprint["all_backlog"])
    recent = "\n".join(f"  - {c}" for c in commits[:5])

    content = f"""---
name: Project Sprint Status
description: Current sprint/epic status and recent git activity for JellySync — auto-updated on git commit/push
type: project
---

**Last updated:** {today}

## Epic Status

{chr(10).join(epic_lines)}

## Story Counts
- Completed stories: {done_count}
- Backlog stories: {backlog_count}

## Recent Commits
{recent}

## How to apply
Use this to quickly answer "where are we in the project?" without reading sprint-status.yaml.
Epic 6 (cross-platform polish, Docker deployment) is the only remaining epic.
"""

    MEMORY_FILE.write_text(content)

    # Update MEMORY.md index
    memory_index = MEMORY_DIR / "MEMORY.md"
    pointer = "- [project_sprint_status.md](project_sprint_status.md) — Current epic/sprint status, auto-updated on every git push"

    if memory_index.exists():
        idx_content = memory_index.read_text()
        if "project_sprint_status.md" not in idx_content:
            memory_index.write_text(idx_content.rstrip() + "\n" + pointer + "\n")
    else:
        memory_index.write_text("# Memory Index\n\n" + pointer + "\n")


if __name__ == "__main__":
    main()
