
var fs = require("fs")
,   pth = require("path")
,   spawn = require("child_process").spawn
,   utils = require("util")
,   EventEmitter = require("events").EventEmitter
,   shortid = require("shortid")
;

// Handle update sessions for long-running processes
function UpdateSession () {
    this.id = shortid.generate();
    this.done = false;
    this.queue = [];
}
utils.inherits(UpdateSession, EventEmitter);
UpdateSession.prototype.progress = function (msg) {
    this.queue.push(["progress", msg]);
    this.emit("progress", msg);
    return this;
};
UpdateSession.prototype.error = function (msg) {
    this.queue.push(["error", msg]);
    this.emit("error", msg);
    return this;
};
UpdateSession.prototype.end = function () {
    this.done = true;
    this.queue.push(["end"]);
    this.emit("end");
    return this;
};
// returns the queue of messages, and empties it
UpdateSession.prototype.messages = function () {
    var ret = this.queue;
    this.queue = [];
    return ret;
};

function sessionAndCBErr (session, err, cb) {
    session.error(err).end();
    cb(err);
}

function runCommands (conf, session, commands, cb) {
    var totCmd = commands.length;
    function runUntilEmpty () {
        var command = commands.shift()
        ,   curCmd = totCmd - commands.length;
        session.progress("Running git command " + curCmd + "/" + totCmd + ".\n");
        var spawnOpt = { cwd: command[2] };
        if (conf.uid) spawnOpt.uid = conf.uid;
        if (conf.gid) spawnOpt.gid = conf.gid;
        var child = spawn(command[0], command[1], spawnOpt);
        child.on("error", function (err) {
            sessionAndCBErr(session, err, cb);
        });
        child.on("exit", function (code) {
            if (code === null) return; // normally "error" has been triggered
            if (code === 0) {
                session.progress("Done: git " + command[1].join(" ") + " (" + curCmd + "/" + totCmd + ").\n");
                commands.length > 0 ? runUntilEmpty() : cb();
            }
            else {
                sessionAndCBErr(session, "Exit code for git: " + code, cb);
            }
        });
        child.stdout.on("data", function (data) {
            session.progress(data instanceof Buffer ? data.toString("utf8") : data);
        });
        child.stderr.on("data", function (data) {
            if (data instanceof Buffer) data = data.toString("utf8");
            session.progress("[ERR]" + data);
        });
    }
    runUntilEmpty();
}

exports.clone = function (conf, cb) {
    var session = new UpdateSession();
    fs.exists(pth.join(conf.cwd, conf.name), function (exists) {
        if (exists) return cb("Cannot clone, directory already exists.");
        var commands = [
            ["git", ["clone", "-b", conf.branch, conf.git, conf.name], conf.cwd]
        ,   ["git", "submodule update --init --recursive".split(" "), conf.cwd]
        ];
        runCommands(conf, session, commands, cb);
    });
    return session;
};

// update
//     commands.push(["git", "fetch origin".split(" "), app.contentPath]);
//     commands.push(["git", ("reset --hard refs/remotes/origin/" + branch).split(" "), app.contentPath]);

