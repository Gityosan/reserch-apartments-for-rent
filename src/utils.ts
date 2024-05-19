import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { JSDOM } from "jsdom";
import { $fetch } from "ofetch";

export const htmlDir = path.join(__dirname, "html");

export async function fetchHTML(url: string): Promise<string> {
	if (!url) return "";
	const data = await $fetch(url);
	return data;
}

export async function saveHTML(url: string, html: string): Promise<void> {
	const dom = new JSDOM(html);
	const document = dom.window.document;

	// 不要なタグを削除
	const scripts = document.querySelectorAll("script, style, link");
	for (const script of scripts) {
		script.remove();
	}

	const cleanedHtml = dom.serialize();

	// ファイル名を作成
	const fileName = `${url
		.replace(/https?:\/\//, "")
		.replace(/[\/:]/g, "_")}.html`;
	const filePath = path.join(htmlDir, fileName);

	// HTMLを保存
	fs.writeFileSync(filePath, cleanedHtml, "utf8");
	console.log(`Saved: ${filePath}`);
}

export function htmlFilePath(url: string): string {
	if (!url) return path.join(htmlDir, `${crypto.randomUUID()}.html`);
	return path.join(
		htmlDir,
		`${url.replace(/https?:\/\//, "").replace(/[\/:]/g, "_")}.html`,
	);
}

export async function parseHTML(
	filePath: string,
	fields: { [key: string]: string },
): Promise<{ [key: string]: string }> {
	const html = fs.readFileSync(filePath, "utf8");
	const dom = new JSDOM(html);
	const document = dom.window.document;
	const record: any = {};

	for (const [fieldName, xpathExpression] of Object.entries(fields)) {
		const nodes = document.evaluate(
			xpathExpression,
			document,
			null,
			dom.window.XPathResult.ANY_TYPE,
			null,
		);
		const result = nodes.iterateNext();
		record[fieldName] = result ? result.textContent : "";
	}

	return record;
}

export function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
