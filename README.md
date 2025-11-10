
# Regency Code Finder

A Next.js application for managing and searching region codes (provinsi, kabupaten, kecamatan, kelurahan) with file upload, filtering, pagination, and download features. Built with Mantine v6, MantineReactTable, XLSX, Tabler Icons, and TypeScript.

## Installation

1. **Clone the repository:**
	```bash
	git clone https://github.com/danang0202/regency-code-finder.git
	cd regency-code-finder
	```

2. **Install dependencies:**
	```bash
	npm install
	```

3. **Run the development server:**
	```bash
	npm run dev
	```
	The app will be available at `http://localhost:3000`.

## Project Structure

- `src/app/` — Main Next.js app code
- `src/helper/` — Helper functions for file processing, API responses, etc.
- `src/components/` — Reusable UI components
- `public/` — Static assets
- `storage/` — Uploaded and processed files

## Collaborator Guidelines

To keep the codebase clean and maintainable, please follow these rules:

### 1. Issue-Driven Development
- **Always start by creating an Issue** for any bug, feature, or improvement.
- Clearly describe the problem or feature in the Issue.

### 2. Branching Strategy
- **Create a new branch for each Issue.**
- Name your branch using the Issue number and a prefix:
  - For features: `feature/<issue-number>-<short-description>`
  - For bugfixes: `bugfix/<issue-number>-<short-description>`
  - For refactoring: `refactor/<issue-number>-<short-description>`
  - For documentation: `docs/<issue-number>-<short-description>`
- Example: `feature/12-add-download-button`

### 3. Pull Requests (PR)
- **Open a PR to merge your branch into `main` or the appropriate base branch.**
- Reference the Issue in your PR description (e.g., "Closes #12").
- Add a clear summary of your changes and testing steps.
- Request review from at least one other collaborator.
- Address all review comments before merging.

### 4. Code Quality
- Follow the existing code style and structure.
- Use helper functions and reusable components where possible.
- Write clear, maintainable, and well-documented code.
- Run `npm run lint` and fix any lint errors before submitting a PR.

### 5. Better Collaboration Mechanism (Optional)
- For larger features, consider using [GitHub Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects) or [Discussions](https://docs.github.com/en/discussions) for planning.
- Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for commit messages (e.g., `feat: add download button`).
- Automate PR checks with GitHub Actions (lint, test, build).

## License

MIT

---

Feel free to suggest improvements to this workflow!
