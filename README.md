# C++ Serbia Community Website

Next.js application for the C++ Serbia community, featuring events, resources, and community information.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/cppserbia/cppserbia-org-website)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)

## Overview

This is the official website for the C++ Serbia community, built with Next.js, TypeScript, and Tailwind CSS. The site showcases community events, provides resources for C++ developers, and serves as a hub for the local C++ community in Serbia.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cppserbia-org-website
```

2. Install dependencies:
```bash
pnpm install
```

3. Run the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Available Scripts

- `pnpm dev` - Runs the development server
- `pnpm build` - Builds the application for production
- `pnpm start` - Starts the production server
- `pnpm lint` - Runs ESLint for code linting

## Project Structure

- `/app` - Next.js 13+ app directory with pages and layouts
- `/components` - Reusable React components
- `/events` - Markdown files containing event information
- `/public` - Static assets
- `/lib` - Utility functions and configurations

## Adding New Events

To add a new event to the website, create a new Markdown file in the `/events` directory following this process:

1. Create a Meetup.com event first
2. Copy `/events/_template-event.md`
3. Rename it to `YYYY-MM-DD-Event-Title.md`
4. Fill in the event details
5. Submit a pull request

### File Naming Convention

Event files should be named using the format: `YYYY-MM-DD-Event-Title.md`

Example: `2025-06-15-Advanced-Template-Metaprogramming.md`

### Required Front Matter

Each event file must start with YAML front matter containing the following fields:

```yaml
---
title: "Event Title"
date: 2025-06-15T18:00:00+02:00
created: 2025-05-30T10:00:00+02:00
event_type: PHYSICAL | ONLINE | HYBRID
status: UPCOMING | PAST | DRAFT
duration: PT3H  # ISO 8601 duration format
end_time: 2025-06-15T21:00:00+02:00
event_url: https://www.meetup.com/cpp-serbia/events/123456789/
event_id: 123456789
venues: ['Venue Name, City, Country Code']
youtube: https://www.youtube.com/watch?v=VIDEO_ID  # (optional, for past events)
---
```

### Content Structure

After the front matter, include:
- Event title as H1
- Brief description and speaker bio
- Link to Slack workspace and calendar
- Event details table with speaker, date, location, and online link

See the template file at `/events/_template-event.md` for a complete example.

### Event Status Guidelines

- `UPCOMING` - Future events that are scheduled
- `PAST` - Events that have already occurred
- `DRAFT` - Only shown in `dev` environment and will not be published
