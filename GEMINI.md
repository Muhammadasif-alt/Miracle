# MANDATORY WORKSPACE & FILE ISOLATION POLICY

## 1. Approved Project Hierarchy
The ONLY approved parent directory for development projects on this system is:
`D:\PROJECTS\`

Every project must live and operate strictly within its own subfolder:
- `D:\PROJECTS\Black Bird\`
- `D:\PROJECTS\VOID\`
- `D:\PROJECTS\LOCKIN\`
- `D:\PROJECTS\Lead-Hunting-Rank-main\` (Miracle OS)
- `D:\PROJECTS\NOIR\`
- `D:\PROJECTS\Core\`
- `D:\PROJECTS\OmniRoute\`
- `D:\PROJECTS\OmniVoice\`
- `D:\PROJECTS\_shared-tools\` (Shared binary tools such as PostgreSQL)

## 2. Working Directory Scoping Rules
- BEFORE executing any task, explicitly identify the target project.
- Derive all paths, commands, build outputs, and test files strictly from that project's verified absolute root (`D:\PROJECTS\<Project>`).
- When working on Black Bird: modify files in `D:\PROJECTS\Black Bird` only.
- When working on VOID: modify files in `D:\PROJECTS\VOID` only.
- When working on LOCKIN: modify files in `D:\PROJECTS\LOCKIN` only.
- When working on Miracle / Lead-Hunting: modify files in `D:\PROJECTS\Lead-Hunting-Rank-main` only.
- When working on NOIR: modify files in `D:\PROJECTS\NOIR` only.
- When working on Core: modify files in `D:\PROJECTS\Core` only.

## 3. Strict Prohibitions
- NEVER create, save, output, or modify project-related files directly in:
  - `D:\` (root drive)
  - Desktop
  - Downloads
  - Windows Startup directories (`Software\Microsoft\Windows\CurrentVersion\Run`, Startup folder)
  - Unrelated project directories
  - Random temporary working directories
- Prohibited file types include source code, JSON files, logs, generated images, exports, test files/results, screenshots, databases, caches, build artifacts, marker files (`.workspace_anchor`, `.anchor`, `.keep`, `.placeholder`), startup scripts, and backups.
- NEVER silently create a new project folder outside `D:\PROJECTS\`.
- NEVER overwrite, merge, or delete another project's files.
- NEVER automatically register Windows startup items or scheduled tasks.

## 4. Enforcement & Session Guidelines
- When opening an Antigravity workspace or terminal, ALWAYS select the folder inside `D:\PROJECTS\<Project>`.
- Do not keep stale sessions open pointing to legacy drive-root paths (`D:\<Project>`).
- If an operation genuinely requires an external location, explain why and request explicit user approval before proceeding.
