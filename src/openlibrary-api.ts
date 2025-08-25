interface AuthorData {
	url: string;
	name: string;
	ratings_average: number;
	work_count: number;
	top_work: string;
	top_subjects: string[];
}

interface AuthorSearchResult {
	numFound: number;
	start: number;
	numFoundExact: boolean;
	docs: Array<{
		key: string;
		name: string;
		work_count: number;
		top_work: string;
		top_subjects: string[];
		ratings_average?: number;
	}>;
}

interface AuthorDetails {
	key: string;
	name: string;
	work_count: number;
	top_work: string;
	top_subjects: string[];
	ratings_average?: number;
}

export async function getOpenLibraryPersonInfo(
	identifier?: string
): Promise<AuthorData | null> {
	try {
		// Если ID не указан или это не OL ID - ищем по имени
		const searchQuery = identifier || "";
		const searchResponse = await fetch(
			`https://openlibrary.org/search/authors.json?q=${encodeURIComponent(
				searchQuery
			)}`
		);

		if (!searchResponse.ok) {
			throw new Error(`Search request failed: ${searchResponse.status}`);
		}

		// Правильно преобразуем Response в JSON
		const searchData: AuthorSearchResult = await searchResponse.json();

		if (searchData.numFound === 0 || searchData.docs.length === 0) {
			return null;
		}

		// Берем первый результат поиска
		const firstResult = searchData.docs[0];
		const authorKey = firstResult.key.replace("/authors/", "");

		return {
			url: `https://openlibrary.org/authors/${authorKey}`,
			name: firstResult.name,
			ratings_average: firstResult.ratings_average || 0,
			work_count: firstResult.work_count,
			top_work: firstResult.top_work,
			top_subjects: firstResult.top_subjects || [],
		};
	} catch (error) {
		console.error("Error fetching author data:", error);
		return null;
	}
}

export function formatOpenLibraryResult(authorData: AuthorData | null): string {
	if (!authorData) {
		return "- OpenLibraryInfo: Данные автора не найдены или произошла ошибка";
	}

	const lines = [
		`- OpenLibraryInfo: [профиль ${authorData.name}](${authorData.url})`,
		`\t- Рейтинг: ${authorData.ratings_average}`,
		`\t- Количество работ: ${authorData.work_count}`,
		`\t- Лучшая работа: ${authorData.top_work}`,
		`\t- Темы работ, теги: ${authorData.top_subjects.join(", ")}`,
	];

	return lines.join("\n");
}

export default getOpenLibraryPersonInfo;
