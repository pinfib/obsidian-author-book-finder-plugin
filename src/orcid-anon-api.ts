interface OrcidSearchResult {
	"expanded-result": Array<{
		"orcid-id": string;
		"given-names": string;
		"family-names": string;
		"credit-name": string | null;
		"other-name": string[];
		email: string[];
		"institution-name": string[];
	}>;
	"num-found": number;
}

interface OrcidSummary {
	name: string;
	orcid: string;
	employmentAffiliations: Array<{
		organizationName: string;
		url: string | null;
		startDate: string;
		endDate: string | null;
		role: string;
		type: string;
		validated: boolean;
		putCode: number;
	}>;
	employmentAffiliationsCount: number;
	creation: string;
	lastModified: string;
	validatedWorks: number;
	selfAssertedWorks: number;
	selfAssertedPeerReviews: number;
	peerReviewsTotal: number;
	peerReviewPublicationGrants: number;
	validatedFunds: number;
	selfAssertedFunds: number;
	professionalActivities: any | null;
	professionalActivitiesCount: number;
	externalIdentifiers: Array<{
		id: string;
		commonName: string;
		reference: string;
		url: string;
		validated: boolean;
	}>;
	status: string;
	educationQualifications: Array<{
		organizationName: string;
		url: string | null;
		startDate: string;
		endDate: string | null;
		role: string;
		type: string;
		validated: boolean;
		putCode: number;
	}>;
	educationQualificationsCount: number;
	validatedResearchResources: number;
	selfAssertedResearchResources: number;
	emailDomains: string[];
	emailDomainsCount: number;
}

interface ResearcherInfo {
	profileId: string;
	familyName: string;
	givenName: string;
	source: string;
	// affiliations: string[];
	// works: {
	// 	validated: number;
	// 	selfAsserted: number;
	// };
	// education: Array<{
	// 	organization: string;
	// 	role: string;
	// 	startDate: string;
	// 	endDate: string | null;
	// }>;
	// otherIdentifiers: Array<{
	// 	name: string;
	// 	value: string;
	// 	url: string;
	// }>;
}

export async function getOrcidPersonalInfo(
	name: string
): Promise<ResearcherInfo | null> {
	console.info("-> Запрос к Orcid, строка поиска: ", name);

	try {
		const encodedName = encodeURIComponent(name);
		const searchUrl = `https://pub.orcid.org/v3.0/expanded-search/?q=%7B!edismax%20qf%3D%22given-and-family-names%5E50.0%20family-name%5E10.0%20given-names%5E10.0%20credit-name%5E10.0%20other-names%5E5.0%20text%5E1.0%22%20pf%3D%22given-and-family-names%5E50.0%22%20bq%3D%22current-institution-affiliation-name%3A%5B*%20TO%20*%5D%5E100.0%20past-institution-affiliation-name%3A%5B*%20TO%20*%5D%5E70%22%20mm%3D1%7D${encodedName}&start=0&rows=1`;

		const searchResponse = await fetch(searchUrl, {
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!searchResponse.ok) {
			throw new Error(
				`Search HTTP error! status: ${searchResponse.status}`
			);
		}

		const responseText = await searchResponse.text();
		const searchData: OrcidSearchResult = JSON.parse(responseText);

		if (
			searchData["num-found"] === 0 ||
			searchData["expanded-result"].length === 0
		) {
			return null;
		}

		const firstResult = searchData["expanded-result"][0];

		return {
			profileId: firstResult["orcid-id"],
			familyName: firstResult["family-names"],
			givenName: firstResult["given-names"],
			source: "Orcid API",
		};
	} catch (error) {
		console.error("Error fetching researcher info:", error);
		return null;
	}
}

export function formatOrcidPersonalInfo(
	researcherInfo: ResearcherInfo | null
): string {
	if (!researcherInfo) {
		return "";
	}

	const lines: string[] = [];

	if (!researcherInfo?.profileId) {
		return "- ORCID: Данные исследователя не найдены или произошла ошибка";
	}

	lines.push(
		`- ORCID: [профиль ${researcherInfo?.givenName || ""} ${
			researcherInfo?.familyName || ""
		}](https://orcid.org/${researcherInfo?.profileId}), источник: ${
			researcherInfo.source
		} (на этом ресурсе автор сам заполняет данные о себе)`
	);

	return lines.join("\n");
}

export default getOrcidPersonalInfo;
