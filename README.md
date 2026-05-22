# Vercel Blob Explorer

Vercel Blob Explorer is a small Electron-based storage client for Vercel Blob Storage. It makes browsing and managing assets easier by providing a desktop UI to list, upload, download, create and delete files/folders and view basic storage metadata and stats.

## Features
- Authenticate with a Vercel Blob token
- List folders and files (folded and expanded modes)
- Upload single files or entire folders (preserves folder structure)
- Download single files or entire folders (folder downloads are zipped)
- Create and delete folders/files
- View file metadata and storage statistics
- Progress UI and native file dialogs (Electron)

## Technology
- Electron (electron-forge)
- Vite + React + TypeScript
- @vercel/blob SDK
- Tailwind CSS
- adm-zip, axios, electron-log

## Requirements
- Node.js (16+ recommended)
- Yarn or npm
- A Vercel token with access to your Vercel Blob storage

## Development / Quick start

Using yarn:
```bash
yarn install
yarn start
```

Using npm:
```bash
npm install
npm run start
```

Common scripts (defined in package.json):
- start — Run the app in development
- package — Create platform packages (electron-forge)
- make — Build distributables
- make-windows — Build Windows distributable
- publish — Publish via electron-forge
- lint — Run ESLint

## Packaging

Build or package using electron-forge:
```bash
# package (cross-platform)
yarn package
yarn make

# Windows-specific build
yarn make-windows
```

Or use npm equivalents:
```bash
npm run package
npm run make
```

## Usage
1. Launch the app.
2. Enter your Vercel Blob token when prompted.
3. Browse the storage, upload/download files or folders, create/delete folders, and view metadata or storage stats.

Notes:
- Uploads use streaming/multipart to support large files.
- Folder downloads are assembled in a temporary directory then zipped for the user.
- The app communicates with the main process via IPC handlers and uses native dialogs for file selection and saves.

## Contributing
Contributions, issues and pull requests are welcome. Before submitting:
- Follow TypeScript and ESLint rules (run `yarn lint`).
- Keep changes focused and documented.

## License
MIT — see the LICENSE file.

## Acknowledgements
Built by coditive AG. Uses @vercel/blob SDK and electron-forge.