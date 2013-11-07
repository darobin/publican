/*jshint es5: true */

var express = require("express")
,   app = express()
,   DB = require("nedb")
,   rimraf = require("rimraf")
;

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

// errors
function error (res, err) {
    res.send({ ok: false, error: err });
}

// API
//  - list specs (includes snapshots list)
//  - add spec
//  - remove spec
//  - make snapshot
//  - remove snapshot

app.get("/api/specs", function (req, res) {
    db.find({}, function (err, docs) {
        if (err) return error(res, err);
        res.send(docs);
    });
});

app.put("/api/spec/:name", function (req, res) {
    // validate name
    // override it in data
    // snapshots = []
    // data has git repo, branch
    // start the repo process
    // respond with 206 (?)
    // it is then possible to poll
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

app.listen(process.env.PORT);
