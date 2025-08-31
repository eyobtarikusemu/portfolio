const express = require("express");
const router = express.Router();
const { getProjects, createProject } = require("../controllers/projects");

router.get("/projects", getProjects);
router.post("/projects", createProject);
//router.get("/projects/:id");
//router.patch("/projects/:id", (req, res) => {});
//router.delete("/projects/:id", (req, res) => {});

module.exports = router;
