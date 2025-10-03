// Модели
export interface SemanticScholarAuthorData {
	url: string;
	name: string;
	citation_count?: number;
	paper_count?: number;
	h_index?: number;
}

// Метод запроса
export async function getSemanticScholarAuthorInfo(
	name?: string
): Promise<SemanticScholarAuthorData | null> {
	console.info("-> Запрос к SemanticScholar, строка поиска: ", name);

	if (!name) {
		return null;
	}

	const searchUrl = `https://api.semanticscholar.org/graph/v1/author/search?query=${encodeURIComponent(
		name
	)}&limit=1`;

	try {
		const response = await fetch(searchUrl);
		if (!response.ok) {
			throw new Error(`Ошибка HTTP: ${response.status}`);
		}

		const data = await response.json();
		if (
			!data?.total ||
			data.total === 0 ||
			!data.items ||
			data.items.length === 0
		) {
			return null;
		}

		const author = data.items[0];
		const authorId = author.authorId;
		const authorUrl = `https://www.semanticscholar.org/author/${authorId}`;

		// Получение дополнительных данных об авторе
		const detailsUrl = `https://api.semanticscholar.org/graph/v1/author/${authorId}`;
		const detailsResponse = await fetch(detailsUrl);
		if (!detailsResponse.ok) {
			return {
				url: authorUrl,
				name: author.name,
			};
		}

		const detailsData = await detailsResponse.json();

		return {
			url: authorUrl,
			name: author.name,
			citation_count: detailsData.citationCount,
			paper_count: detailsData.paperCount,
			h_index: detailsData.hIndex,
		};
	} catch (error) {
		console.error("Ошибка при получении данных об авторе:", error);
		return null;
	}
}

// Метод формирования строки
export function formatSemanticScholarAuthorInfo(
	authorData: SemanticScholarAuthorData | null
): string {
	if (!authorData) {
		return "- Semantic Scholar: Данные автора не найдены или произошла ошибка";
	}

	const lines: string[] = [];
	lines.push(
		`- [${authorData.name}](${authorData.url}), профиль автора на Semantic Scholar`
	);

	if (authorData.citation_count !== undefined) {
		lines.push(`\t- Количество цитирований: ${authorData.citation_count}`);
	}

	if (authorData.paper_count !== undefined) {
		lines.push(`\t- Количество публикаций: ${authorData.paper_count}`);
	}

	if (authorData.h_index !== undefined) {
		lines.push(`\t- Индекс Хирша (h-index): ${authorData.h_index}`);
	}

	return lines.join("\n");
}

export default getSemanticScholarAuthorInfo;
