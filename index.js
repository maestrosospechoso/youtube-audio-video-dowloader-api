const express = require("express");
const youtubedl = require("youtube-dl-exec");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (req, res) => {
    // Si es una petición de API (con query params o headers específicos), mantener el comportamiento original
    if (req.query.url || req.headers['accept'] === 'application/json') {
        const ping = new Date();
        ping.setHours(ping.getHours() - 3);
        console.log(
            `Ping at: ${ping.getUTCHours()}:${ping.getUTCMinutes()}:${ping.getUTCSeconds()}`
        );
        res.sendStatus(200);
    } else {
        // Servir la interfaz web
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

app.get("/info", async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).send("Invalid query");
    }

    try {
        const info = await youtubedl(url, {
            dumpSingleJson: true,
            noWarnings: true,
            noCallHome: true,
            noCheckCertificate: true,
            preferFreeFormats: true,
            youtubeSkipDashManifest: true,
        });

        res.json({
            title: info.title,
            thumbnail: info.thumbnail
        });
    } catch (error) {
        console.error('Error getting video info:', error);
        res.status(500).send("Error getting video info");
    }
});

app.get("/formats", async (req, res) => {
    const { url } = req.query;

    if (!url) return res.status(400).send("Invalid query");

    try {
        const info = await youtubedl(url, {
            dumpSingleJson: true,
            noWarnings: true,
            noCallHome: true,
            noCheckCertificate: true,
            preferFreeFormats: true,
            youtubeSkipDashManifest: true,
        });

        const formats = info.formats.map(f => ({
            itag: f.format_id,
            mimeType: f.ext ? `${f.vcodec !== 'none' ? 'video' : 'audio'}/${f.ext}` : 'unknown',
            qualityLabel: f.height ? `${f.height}p` : null,
            audioBitrate: f.abr || null,
            container: f.ext,
            contentLength: f.filesize ? `${(f.filesize / (1024 * 1024)).toFixed(2)} MB` : null
        }));

        res.json({
            title: info.title,
            formats: formats
        });
    } catch (error) {
        console.error('Error getting formats:', error);
        res.status(500).send("Error getting formats");
    }
});

app.get("/download", async (req, res) => {
    const { url, itag } = req.query;

    if (!url || !itag) return res.status(400).send("Missing url or itag");

    try {
        const info = await youtubedl(url, {
            dumpSingleJson: true,
            noWarnings: true,
            noCallHome: true,
            noCheckCertificate: true,
            preferFreeFormats: true,
            youtubeSkipDashManifest: true,
        });

        const format = info.formats.find(f => f.format_id === itag);
        if (!format) return res.status(400).send("Invalid itag");

        const filename = `${info.title.replace(/[^\w\s]/gi, '')}.${format.ext}`;
        res.header("Content-Disposition", `attachment; filename="${filename}"`);

        // Stream the video directly
        const stream = youtubedl.exec(url, {
            format: itag,
            output: '-',
            noWarnings: true,
            noCallHome: true,
            noCheckCertificate: true,
        });

        stream.stdout.pipe(res);
        
        stream.on('error', (error) => {
            console.error('Download error:', error);
            if (!res.headersSent) {
                res.status(500).send("Download error");
            }
        });

    } catch (error) {
        console.error('Error downloading:', error);
        res.status(500).send("Error downloading video");
    }
});

app.listen(process.env.PORT || 8000, () => {
    console.log("Server is alive");
});