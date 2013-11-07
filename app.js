/*jshint es5: true */

var express = require("express")
,   app = express()
,   DB = require("nedb")
,   rimraf = require("rimraf")
,   pth = require("path")
,   fs = require("fs")
,   repo = require("./repo")
,   trDir = pth.join(__dirname, "public/TR")
,   snapDir = pth.join(__dirname, "public/snapshots")
,   sessions = {}
;

if (!fs.existsSync(trDir)) fs.mkdirSync(trDir);
if (!fs.existsSync(snapDir)) fs.mkdirSync(snapDir);

app.use(express.logger());
app.use(express.compress());
app.use(express.methodOverride());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.cookieParser());
app.use(express.cookieSession({ secret: "Indian Pale Ale" }));
// app.use(express.csrf());
app.use(express.static("public"));

// DB
var db = new DB({ filename: "specs.db", autoload: true });
db.ensureIndex({ fieldName: "name", unique: true }, function () {}); // yeah, we should probably wait

// errors
function error (res, err) {
    console.error(err);
    res.send({ ok: false, error: err });
}

// --- API ---

// GET /api/specs
// Returns an array of specs
app.get("/api/specs", function (req, res) {
    db.find({}, function (err, docs) {
        if (err) return error(res, err);
        res.send(docs);
    });
});

// PUT /api/spec/:name
//  JSON data should include: name, title, git, branch?
//  Clones the git URL, and replies with a 202 the payload for which contains a link to a
//  session endpoint that can be queried for progress. Once done, adds the spec to the DB.
app.put("/api/spec/:name", function (req, res) {
    var spec = req.body;
    if (spec.name !== req.params.name) return error(res, "Name doesn't match data.");
    if (!/^[\w_\-]+$/.test(spec.name)) return error(res, "Bad name, stick to /^[\\w_-]+$/.");
    spec.snapshots = [];
    if (!spec.title) spec.title = "Untitled Specification";
    var session = repo.clone({
            git:    spec.git
        ,   branch: spec.branch || "master"
        ,   name:   spec.name
        ,   cwd:    trDir
        }
    ,   function (err) {
            if (err) return error(res, err);
            db.insert(spec, function (err) {
                if (err) return error(res, err);
            });
        }
    );
    sessions[session.id] = session;
    res.json(202, { session: true, id: session.id, path: "/session/" + session.id });
});

app.del("/api/spec/:name", function (req, res) {
    db.remove({ name: req.params.name }, {}, function (err, count) {
        if (err) return error(res, err);
        function resp () { res.send({ ok: true, numberRemoved: count }); }
        if (count) {
            // XXX also remove snapshots and from TR
            // be really sure to check that name is what we think it is
            // rimraf(file, resp)
        }
        else resp();
    });
});

app.post("/api/spec/:name/snapshot", function (req, res) {
    // data contains level and date
    // name must exist already
    // start the clone process, setting to given commit
    // respond with 206 (?)
    // it is then possible to poll
    // $push snapshot YYYYMMDD-{FPWD,LCCR,REC} to snapshots
});

app.post("/api/spec/:name/snapshot", function (req, res) {
    // data contains level and date
    // name must exist already
    // start the clone process, setting to given commit
    // respond with 206 (?)
    // it is then possible to poll
    // $push snapshot YYYYMMDD-{FPWD,LCCR,REC} to snapshots
});

app.del("/api/spec/:name/snapshot/:snapshot", function (req, res) {
    // $pull from name
    // rm
    // be cautious
    // format is YYYYMMDD-{FPWD,LCCR,REC}
});

// GET /session/:id
// returns the last messages of a session for a long-running job (e.g npm)
// this is meant for polling
app.get("/session/:id", function (req, res) {
    var id = req.params.id
    ,   session = sessions[id]
    ;
    if (!session) return res.json(404, { error: "No such running session." });
    if (session === "done") return res.json({ done: true });
    res.json({ messages: session.messages() });
    if (session.done) sessions[id] = "done";
});

app.listen(process.env.PORT);
