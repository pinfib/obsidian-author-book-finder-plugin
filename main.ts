import { App, Editor, MarkdownView, Menu, Plugin } from "obsidian";
import {
	getWikidataPersonInfo,
	formatWikiDataResult,
} from "./src/wikidata-api";
import {
	getOpenLibraryPersonInfo,
	formatOpenLibraryResult,
} from "./src/openlibrary-api";
import {
	getOrcidPersonalInfo,
	formatOrcidPersonalInfo,
} from "./src/orcid-anon-api";
import {
	getWikipediaPageInfo,
	formatWikipediaMarkdownLink,
} from "./src/wikipedia-page-search";

interface TextInsertPluginSettings {
	defaultText: string;
}

const DEFAULT_SETTINGS: TextInsertPluginSettings = {
	defaultText: "## Вставленный текст\nВот ваш добавленный контент!",
};

export default class TextInsertPlugin extends Plugin {
	settings: TextInsertPluginSettings;

	async onload() {
		await this.loadSettings();

		// Добавляем команду в контекстное меню
		this.registerEvent(
			this.app.workspace.on(
				"editor-menu",
				(menu: Menu, editor: Editor) => {
					this.addToContextMenu(menu, editor);
				}
			)
		);
	}

	// Добавляем пункт в контекстное меню
	private addToContextMenu(menu: Menu, editor: Editor) {
		menu.addItem((item) => {
			item.setTitle("Поиск авторов книг в АПИ")
				.setIcon("search")
				.onClick(() => {
					this.insertCustomText(editor);
				});
		});
	}

	// Функция для вставки текста
	private async insertCustomText(editor: Editor) {
		const selection = editor.getSelection();

		let wikipediaLink = formatWikipediaMarkdownLink(
			await getWikipediaPageInfo(selection)
		);

		let wikiData = await getWikidataPersonInfo(selection.trim());

		let wikiDataString = formatWikiDataResult(wikiData);

		let openLibraryString = formatOpenLibraryResult(
			await getOpenLibraryPersonInfo(
				wikiData?.englishName || wikiData?.russianName || ""
			)
		);

		let orcidString = formatOrcidPersonalInfo(
			await getOrcidPersonalInfo(
				wikiData?.englishName || wikiData?.russianName || ""
			)
		);

		// Заменяем выделенный текст на наш кастомный текст
		editor.replaceSelection(
			`${wikipediaLink}\n${wikiDataString}\n${openLibraryString}\n${orcidString}`
		);
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
