# YouTube Download API

Tiny HTTP API for getting YouTube video info, listing available formats, and downloading a chosen format — built with **Express**, **[@distube/ytdl-core](https://www.npmjs.com/package/@distube/ytdl-core)**, and **CORS**.

## ✨ Endpoints

### `GET /`
Health check (logs a timestamp).
```

GET [http://localhost:8000/](http://localhost:8000/)

```

---

### `GET /info?url=YOUTUBE_URL`
Returns basic info: title and a thumbnail.
```

GET http://localhost:8000/info?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ

````
**Response**
```json
{
  "title": "Rick Astley - Never Gonna Give You Up (Official Video) (4K Remaster)",
  "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
}
````

---

### `GET /formats?url=YOUTUBE_URL`

Lists all available formats you can download (video+audio, video-only, audio-only), including `itag`, `mimeType`, `qualityLabel`, `container`, and (if present) size.

```
GET http://localhost:8000/formats?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ
```

**Response (example trimmed)**

```json
{
  "title": "Rick Astley - Never Gonna Give You Up (Official Video) (4K Remaster)",
  "formats": [
    {
      "itag": 18,
      "mimeType": "video/mp4; codecs=\"avc1.42001E, mp4a.40.2\"",
      "qualityLabel": "360p",
      "audioBitrate": 96,
      "container": "mp4",
      "contentLength": null
    },
    {
      "itag": 140,
      "mimeType": "audio/mp4; codecs=\"mp4a.40.2\"",
      "qualityLabel": null,
      "audioBitrate": 128,
      "container": "m4a",
      "contentLength": "3.45 MB"
    }
  ]
}
```

---

### `GET /download?url=YOUTUBE_URL&itag=ITAG`

Streams the exact format by `itag` (sets `Content-Disposition` for download).

```
GET http://localhost:8000/download?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ&itag=18
```

> Tip: `itag=18` is usually MP4 360p with audio.

---

## 🛠 Setup

### 1) Create project & install deps

```bash
mkdir youtube-download-api
cd youtube-download-api
npm init -y
npm install express cors @distube/ytdl-core
```

### 2) Add the server file

Create `index.js` and paste your code (the one you posted).

### 3) Add start script

In `package.json`:

```json
{
  "name": "youtube-download-api",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": { "start": "node index.js" },
  "dependencies": {
    "@distube/ytdl-core": "^4.16.12",
    "cors": "^2.8.5",
    "express": "^4.17.1"
  }
}
```

### 4) Run locally

```bash
npm start
```

Server runs at:

```
http://localhost:8000
```

---

## ❗ Notes & Troubleshooting

* Always **URL-encode** the YouTube URL when calling endpoints (the `?v=` query can break unencoded requests).
* If YouTube changes internals and you see extraction errors, update the lib:

  ```bash
  npm install @distube/ytdl-core@latest
  ```
* This is for personal/educational use — downloading YouTube content may violate YouTube’s Terms of Service.
