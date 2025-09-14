const express = require("express");
const ytdl = require("@distube/ytdl-core");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/", (req, res) => {
    const ping = new Date();
    ping.setHours(ping.getHours() - 3);
    console.log(
        `Ping at: ${ping.getUTCHours()}:${ping.getUTCMinutes()}:${ping.getUTCSeconds()}`
    );
    res.sendStatus(200);
});

app.get("/info", async (req, res) => {
    const { url } = req.query;

    if (url) {
        const isValid = ytdl.validateURL(url);

        if (isValid) {
            const info = (await ytdl.getInfo(url)).videoDetails;

            const title = info.title;
            const thumbnail = info.thumbnails[2].url;

            res.send({ title: title, thumbnail: thumbnail });
        } else {
            res.status(400).send("Invalid url");
        }
    } else {
        res.status(400).send("Invalid query");
    }
});

app.get("/formats", async (req, res) => {
    const { url } = req.query;

    if (!url) return res.status(400).send("Invalid query");

    if (!ytdl.validateURL(url)) return res.status(400).send("Invalid URL");

    try {
        const info = await ytdl.getInfo(url);

        const formats = info.formats.map(f => ({
            itag: f.itag,
            mimeType: f.mimeType,
            qualityLabel: f.qualityLabel || null,
            audioBitrate: f.audioBitrate || null,
            container: f.container,
            contentLength: f.contentLength ? `${(f.contentLength / (1024 * 1024)).toFixed(2)} MB` : null
        }));

        res.json({
            title: info.videoDetails.title,
            formats: formats
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get("/download", async (req, res) => {
    const { url, itag } = req.query;

    if (!url || !itag) return res.status(400).send("Missing url or itag");

    if (!ytdl.validateURL(url)) return res.status(400).send("Invalid URL");

    try {
        const info = await ytdl.getInfo(url);
        const format = ytdl.chooseFormat(info.formats, { quality: itag });

        if (!format) return res.status(400).send("Invalid itag");

        res.header("Content-Disposition", `attachment; filename="${info.videoDetails.title}.${format.container}"`);

        ytdl(url, { format }).pipe(res);
    } catch (err) {
        res.status(500).send(err.message);
    }
});


app.listen(process.env.PORT ||8000, () => {
    console.log("Server is alive");
});
