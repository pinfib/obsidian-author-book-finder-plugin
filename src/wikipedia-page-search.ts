interface WikipediaSearchResult {
	query: {
		search: {
			title: string;
			pageid: number;
		}[];
	};
}

interface WikipediaPageInfo {
	title: string;
	url: string;
}

/**
 * Ищет страницу в Википедии по имени человека и возвращает информацию о странице.
 * @param name - Имя человека для поиска.
 * @returns Промис, который разрешается в объект с названием и URL страницы или null, если страница не найдена.
 */
export async function getWikipediaPageInfo(
	name: string
): Promise<WikipediaPageInfo | null> {
	try {
		const searchQuery = encodeURIComponent(name);
		const url = `https://ru.wikipedia.org/w/api.php?action=query&list=search&srsearch=${searchQuery}&format=json&origin=*`;

		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Ошибка HTTP: ${response.status}`);
		}

		const data: WikipediaSearchResult = await response.json();

		if (data.query.search.length === 0) {
			return null;
		}

		const pageTitle = data.query.search[0].title;
		const pageUrl = `https://ru.wikipedia.org/wiki/${encodeURIComponent(
			pageTitle
		)}`;

		return {
			title: pageTitle,
			url: pageUrl,
		};
	} catch (error) {
		console.error("Ошибка при поиске в Википедии:", error);
		return null;
	}
}

/**
 * Форматирует информацию о странице в Markdown ссылку.
 * @param pageInfo - Информация о странице Википедии.
 * @returns Строка в формате Markdown.
 */
export function formatWikipediaMarkdownLink(
	pageInfo: WikipediaPageInfo | null
): string {
	if (!pageInfo) {
		return "- Не найдена ссылка на страницу в Википедии";
	}
	return `- [${pageInfo.title}](${pageInfo.url})`;
}

export default getWikipediaPageInfo;
