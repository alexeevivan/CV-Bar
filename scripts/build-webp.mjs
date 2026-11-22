import { createHash } from "node:crypto";
import {
	access,
	copyFile,
	mkdir,
	readFile,
	readdir,
	rename,
	rm,
	writeFile,
} from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const projectRoot = process.cwd();
const distDirectory = path.join(projectRoot, "dist");
const imageDirectory = path.join(distDirectory, "assets", "content");
const cacheDirectory = path.join(projectRoot, ".cache", "webp-v1");
const sourceExtensions = new Set([".jpg", ".jpeg", ".png"]);
const textExtensions = new Set([".html", ".js", ".css"]);

async function walk(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const absolutePath = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			files.push(...await walk(absolutePath));
		} else {
			files.push(absolutePath);
		}
	}

	return files;
}

async function exists(filePath) {
	try {
		await access(filePath);
		return true;
	} catch {
		return false;
	}
}

async function convertImage(sourcePath) {
	const source = await readFile(sourcePath);
	const hash = createHash("sha256").update(source).digest("hex");
	const cachePath = path.join(cacheDirectory, `${hash}.webp`);
	const outputPath = sourcePath.replace(/\.(?:jpe?g|png)$/i, ".webp");
	let converted = false;

	if (!await exists(cachePath)) {
		const temporaryPath = `${cachePath}.${process.pid}.tmp`;
		await sharp(source)
			.rotate()
			.webp({ quality: 82, effort: 4, smartSubsample: true })
			.toFile(temporaryPath);
		await rename(temporaryPath, cachePath);
		converted = true;
	}

	await copyFile(cachePath, outputPath);

	return {
		converted,
		from: path.basename(sourcePath),
		to: path.basename(outputPath),
		sourcePath,
	};
}

async function rewriteReferences(replacements) {
	const files = (await walk(distDirectory)).filter((filePath) =>
		textExtensions.has(path.extname(filePath).toLowerCase()),
	);
	let changedFiles = 0;

	for (const filePath of files) {
		const original = await readFile(filePath, "utf8");
		let updated = original;

		for (const { from, to } of replacements) {
			updated = updated.replaceAll(from, to);
		}

		if (updated !== original) {
			await writeFile(filePath, updated);
			changedFiles += 1;
		}
	}

	return changedFiles;
}

await mkdir(cacheDirectory, { recursive: true });

const sourceImages = (await walk(imageDirectory)).filter((filePath) =>
	sourceExtensions.has(path.extname(filePath).toLowerCase()),
);
const results = [];

for (const sourcePath of sourceImages) {
	results.push(await convertImage(sourcePath));
}

const rewrittenFiles = await rewriteReferences(results);

for (const { sourcePath } of results) {
	await rm(sourcePath);
}

const convertedCount = results.filter(({ converted }) => converted).length;
const reusedCount = results.length - convertedCount;

console.log(
	`WebP: ${convertedCount} converted, ${reusedCount} restored from cache, ${rewrittenFiles} output file(s) updated.`,
);
