# Editing Mwaweru with Pages CMS

The site reads its editable copy directly from five JSON files. `.pages.yml` configures their forms, repeatable lists, image pickers, and select fields for [Pages CMS](https://pagescms.org/).

## Connect the repository

1. Publish this `.pages.yml`, the content files, and the accompanying site changes to `M-Waweru/worldmwaweru`.
2. Sign in at [app.pagescms.org](https://app.pagescms.org/) with the GitHub account that can edit that repository.
3. Grant the Pages CMS GitHub app access to `worldmwaweru`, then select the repository and `main` branch.
4. Open one of the configured editors, edit, and save. Pages CMS commits the changes to the selected branch.
5. A Git-connected host such as Netlify or Vercel should build that branch with `npm run build` and publish `dist`. Saving in the CMS then triggers that host’s normal deployment. GitHub storage alone does not deploy the site.

GitHub sign-in and app access belong to the repository owner; no CMS credentials or secret keys are included in this frontend. Until these changes are published and the account is connected, this is a prepared integration, not an authenticated CMS connection.

## What you can edit

| Editor | File | Used on the site |
| --- | --- | --- |
| Welcome and page copy | `content/site.json` | Welcome, homestead/workshop headings, vehicle introduction, Kijazo greeting |
| Homestead and biography | `content/profile.json` | Name, current role, short bio, current work, biography, portrait, photo album |
| Workshop projects | `content/projects.json` | Visual project previews, summaries, categories, URLs, optional live iframe previews |
| People and conversations | `content/people.json` | Resident names, dialogue, note recommendations, coat colours, placement |
| Social links and earlier projects | `content/elsewhere.json` | GitHub, contact/social links, historical project descriptions and attribution |

Keep `mathnuscripts` first in the projects list, and retain the `github` social-link ID. Other list entries can be reordered or added. Project IDs use lowercase letters, numbers, and hyphens. The Mathnuscripts project opens the local writing collection; other projects use their website links.

## Images and previews

Upload images through the media browser under `public/assets`. The CMS stores public paths such as `/assets/uploads/my-photo.webp`; the site handles its deployment base automatically. Supply descriptive image text, not a filename. Preview images are displayed immediately. A live iframe loads only after the visitor chooses **Look inside** or **Play a little here**, keeping the initial workshop lightweight. Sites that block iframes can use a screenshot and their normal open link instead.

The supplied photographs are resized WebP derivatives with source sidecars. The initial project thumbnails are actual screenshots, not invented product interfaces. A new screenshot or photograph uploaded through the CMS does not require a code change.

## Notes and conversations

Use an exact published note ID for a resident’s recommendation. For example, `Space Exploration is About Perspective` opens that complete local article. The build validates these IDs, image paths, field types, IDs, and URLs using `npm run content:check`.

The original 155 complete article bodies and their digests remain managed by the article import pipeline. Use these CMS editors for site copy and recommendations; use `npm run articles:sync` for a deliberate refresh of the published article snapshot.

## Local checks

```sh
npm run content:check
npm test
npm run build
```

JSON text is rendered as React text. The copy editors intentionally use ordinary text and paragraph lists, rather than inserting unchecked HTML into the app.
