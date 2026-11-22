import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";

const [baseCommit = "", headCommit = "HEAD"] = process.argv.slice(2);
const distDirectory = path.resolve("dist");

function quote(value) {
	return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

function splitNull(buffer) {
	return buffer
		.toString("utf8")
		.split("\0")
		.filter(Boolean);
}

function changedPaths(filter) {
	return splitNull(execFileSync("git", [
		"diff",
		"--name-only",
		"--no-renames",
		`--diff-filter=${filter}`,
		"-z",
		baseCommit,
		headCommit,
		"--",
		"dist/",
	]));
}

function allFiles(directory, prefix = "dist") {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const absolutePath = path.join(directory, entry.name);
		const relativePath = path.posix.join(prefix, entry.name);
		return entry.isDirectory() ? allFiles(absolutePath, relativePath) : [relativePath];
	});
}

const uploads = baseCommit ? changedPaths("ACMRTUXB") : allFiles(distDirectory);
const deletions = baseCommit ? changedPaths("D") : [];
const directories = new Set();
const commands = [];

for (const file of deletions) {
	commands.push(`rm -f ${quote(`/${file.slice("dist/".length)}`)}`);
}

for (const file of uploads) {
	const relativePath = file.slice("dist/".length);
	const remoteDirectory = `/${path.posix.dirname(relativePath)}`.replace("/.", "/");
	if (remoteDirectory !== "/" && !directories.has(remoteDirectory)) {
		directories.add(remoteDirectory);
		commands.push(`mkdir -p ${quote(remoteDirectory)}`);
	}
	commands.push(`put -O ${quote(remoteDirectory)} ${quote(file)}`);
}

commands.unshift(`echo ${quote(`Deploy plan: ${uploads.length} upload(s), ${deletions.length} deletion(s)`)}`);
process.stdout.write(`${commands.join("\n")}\n`);
