exports.index = function(req, res) {
    res.sendFile(__dirname + "/Public/index.html", { title: "Spring Simulation" });
}